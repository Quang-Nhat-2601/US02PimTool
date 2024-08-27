import './style.scss';
import $ from 'jquery';

interface Window {
    Xrm: any;
    GetGlobalContext: () => any;
}

interface Project {
    elca_projectid: string;
    elca_projectnumber: string;
    elca_name: string;
    elca_customer: string;
    elca_projectgroupid: string;
    elca_projectstatus: string;
    elca_startdate: string;
    elca_enddate: string;
    ownerid: string;
    elca_members: string;
}

class ProjectFormManagement {
    private context: any;
    private project: Project | null = null;

    private mapStatusToNumber: { [name: string]: string } = {
        "New": "283630000",
        "Planned": "283630001",
        "In Progress": "283630002",
        "Finished": "283630003",
        "Closed": "283630004"
    };

    private mapNumberToStatus: { [name: string]: string } = {
        "283630000": "New",
        "283630001": "Planned",
        "283630002": "In Progress",
        "283630003": "Finished",
        "283630004": "Closed"
    };

    constructor(private executionContext?: Xrm.Events.EventContext) {
        this.initializeContext();
        this.init();
    }

    private initializeContext() {
        if (this.executionContext) {
            this.context = this.executionContext.getFormContext();
        } else if (typeof (window as any).GetGlobalContext === "function") {
            this.context = (window as any).GetGlobalContext();
        } else if (typeof (Xrm as any)?.Utility?.getGlobalContext === "function") {
            this.context = (Xrm as any).Utility.getGlobalContext();
        } else if (typeof (parent as any).Xrm?.Utility?.getGlobalContext === "function") {
            this.context = (parent as any).Xrm.Utility.getGlobalContext();
        } else {
            console.warn("GetGlobalContext is not available, falling back to window.Xrm");
            this.context = (window as any).Xrm || (parent as any).Xrm;
        }

        if (!this.context) {
            throw new Error("Unable to initialize Dynamics 365 context");
        }
    }

    private getClientUrl(): string {
        return this.context.getClientUrl?.() || '';
    }

    private getXrm(): any {
        if (typeof (window as any).Xrm !== "undefined") {
            return (window as any).Xrm;
        } else if (typeof (parent as any).Xrm !== "undefined") {
            return (parent as any).Xrm;
        } else {
            throw new Error("Xrm object is not available");
        }
    }

    private getDataParam() {
        if (window.location.search.indexOf('Data=') === -1) return null;
        var data = decodeURIComponent(window.location.search.split('Data=')[1]);
        return JSON.parse(data);
    }

    private init() {
        var dataParam = this.getDataParam();
        console.log(`Params: ${JSON.stringify(dataParam)}`);
        if (dataParam && dataParam.entity && dataParam.entityId) {
            console.log(`Entity: ${dataParam.entity}`);
            console.log(`entityId: ${dataParam.entityId}`);
            this.loadProjectData(dataParam.entity, dataParam.entityId);
        } else {
            console.log("No data parameter found or invalid data");
        }
    }

    private loadProjectData(entity: string, entityId: string) {
        const xrm = this.getXrm();
        xrm.WebApi.retrieveRecord("account", "6dc4fed6-fa52-ef11-9195-0050569f8865", "?$select=accountid").then(
            (result: any) => {
                console.log("Retrieved data:", result.accountid);
                // this.project = {
                //     elca_projectid: result.elca_projectid,
                //     elca_projectnumber: result.elca_projectnumber,
                //     elca_name: result.elca_name,
                //     elca_customer: result._elca_customer_value,
                //     elca_projectstatus: this.mapNumberToStatus[result.elca_projectstatus?.toString() || ""],
                //     elca_startdate: result.elca_startdate ? new Date(result.elca_startdate).toISOString().split('T')[0] : '',
                //     elca_projectgroupid: result._elca_projectgroupid_value,
                //     elca_enddate: result.elca_enddate ? new Date(result.elca_enddate).toISOString().split('T')[0] : '',
                //     ownerid: result._ownerid_value,
                //     elca_members: result.elca_members
                // };
                // this.populateForm();
            },
            (error: Error) => {
                console.error("Error retrieving record:", error);
            }
        );
    }

    private populateForm() {
        if (!this.project) return;

        $('#projectNumber').val(this.project.elca_projectnumber);
        $('#projectName').val(this.project.elca_name);
        $('#customer').val(this.project.elca_customer);
        $('#group').val(this.project.elca_projectgroupid);
        $('#members').val(this.project.elca_members);
        $('#status').val(this.project.elca_projectstatus);
        $('#startDate').val(this.project.elca_startdate);
        $('#endDate').val(this.project.elca_enddate);

        // Update button text
        $('#create-btn').text('Update Project');
    }

    private updateProject() {
        if (!this.project) return;

        const updatedProject: Partial<Project> = {
            elca_projectnumber: $('#projectNumber').val() as string,
            elca_name: $('#projectName').val() as string,
            elca_customer: $('#customer').val() as string,
            elca_projectgroupid: $('#group').val() as string,
            elca_members: $('#members').val() as string,
            elca_projectstatus: this.mapStatusToNumber[$('#status').val() as string],
            elca_startdate: $('#startDate').val() as string,
            elca_enddate: $('#endDate').val() as string,
        };

        const xrm = this.getXrm();
        xrm.WebApi.updateRecord("elca_project", this.project.elca_projectid, updatedProject).then(
            (result: any) => {
                console.log("Project updated successfully");
                // Optionally, reload the data or show a success message
            },
            (error: Error) => {
                console.error("Error updating project:", error);
                // Show error message to user
            }
        );
    }

    public bindEvents() {
        $('#create-btn').on('click', () => this.updateProject());
        // Add more event bindings as needed
    }
}

function onXrmReady(callback: () => void) {
    if ((window as any).Xrm) {
        callback();
    } else {
        setTimeout(() => onXrmReady(callback), 100);
    }
}

// Initialize the app when Xrm is ready
onXrmReady(() => {
    const app = new ProjectFormManagement();
    app.bindEvents();
});