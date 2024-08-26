import './style.scss';
import $ from 'jquery';

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
    private mapStatusToNumber: { [name: string]: string } = {
        "New":      "283630000",
        "Planned":  "283630001",
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


    constructor() {
        this.init();
    }

    private getDataParam() {
        if (window.location.search.indexOf('Data=') === -1) return null;
        var data = decodeURIComponent(window.location.search.split('Data=')[1]);
        return JSON.parse(data);
    }

    private init() {
        var dataParam = this.getDataParam();
        console.log(`Params: ${dataParam}`);
        if (dataParam && dataParam.entity && dataParam.entityId) {
            console.log(`Entity: ${dataParam.entity}`);
            console.log(`entityId: ${dataParam.entityId}`);
            this.loadProjectData(dataParam.entity, dataParam.entityId);
        } else {
            console.log("No data parameter found or invalid data");
        }
    }

    private loadProjectData(entity: string, entityId: string) {
        parent.Xrm.WebApi.retrieveRecord(entity, entityId).then(
            function success(result) {
                console.log(result);
            },
            function (error: Error) {
                console.log(error);
            }
        );
    }
}

$(function () {
    const app = new ProjectFormManagement();
});