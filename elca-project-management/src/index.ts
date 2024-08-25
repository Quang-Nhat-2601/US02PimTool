import './style.scss';
import DataTable from 'datatables.net-dt';
import 'datatables.net-responsive-dt';
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

class ProjectManagement {
    private projects: Project[] = [];
    private projectTable: any;
    private projectStatusString: string = "Project Status";
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


    constructor() {
        this.loadProjects();
        this.setupEventListeners();
    }

    private loadProjects() {
        console.log("Start load project...")

        const fetchXml = `?fetchXml=<fetch mapping='logical'>
            <entity name='elca_project'>
            <attribute name='elca_projectid' />
            <attribute name='elca_projectnumber' />
            <attribute name='elca_name' />
            <attribute name='elca_customer' />
            <attribute name='elca_projectstatus' />
            <attribute name='elca_startdate' />
            </entity></fetch>`;

        parent.Xrm.WebApi.retrieveMultipleRecords("elca_project", fetchXml).then(
            (result) => {
                console.log("API Response:", result);
                this.projects = result.entities.map(entity => ({
                    elca_projectid: entity.elca_projectid,
                    elca_projectnumber: entity.elca_projectnumber,
                    elca_name: entity.elca_name,
                    elca_customer: entity.elca_customer,
                    elca_projectstatus: this.mapNumberToStatus[entity.elca_projectstatus.toString()],
                    elca_startdate: new Date(entity.elca_startdate).toLocaleDateString(),
                    elca_projectgroupid: entity.elca_projectgroupid,
                    elca_enddate: entity.elca_enddate,
                    ownerid: entity.ownerid,
                    elca_members: entity.elca_members
                }));
                console.log(`Loaded ${this.projects.length} projects:`, this.projects);
                this.renderProjects();
            },
            (error) => {
                console.error("Error loading projects:", error.message);
            }
        );
    }

    private setupSelectAllCheckbox() {
        const table = this.projectTable;

        // Handle click on "Select all" checkbox
        $('#select-all-checkbox').on('click', function(this: HTMLInputElement) {
            const isChecked = this.checked;
            
            $('.chkbx').prop('checked', isChecked);
            
            $(this).trigger('blur');
        });

        $('#myTable tbody').on('change', 'input[type="checkbox"]', function(this: HTMLInputElement) {
            // If any checkbox is unchecked, uncheck "Select all" checkbox
            if (!this.checked) {
                const selectAllCheckbox = $('#select-all-checkbox').get(0);
                if (selectAllCheckbox instanceof HTMLInputElement && selectAllCheckbox.checked) {
                    selectAllCheckbox.checked = false;
                }
            } else {
                // If all checkboxes are checked, check "Select all" checkbox
                const allCheckboxes = table.$('input[type="checkbox"]').get();
                const allChecked = allCheckboxes.every((checkbox: { checked: any; }) => 
                    checkbox instanceof HTMLInputElement && checkbox.checked
                );
                const selectAllCheckbox = $('#select-all-checkbox').get(0);
                if (selectAllCheckbox instanceof HTMLInputElement) {
                    selectAllCheckbox.checked = allChecked;
                }
            }
        });
    }

    private showSelectionStatus() {
        const numOfCheckedCB: number = $('input[type="checkbox"]:checked').length;

        $("#selection-status #selected-count").text(numOfCheckedCB.toString());

        if (numOfCheckedCB > 1) {
            $("#selection-status").show();
        } else {
            $("#selection-status").hide();
        }
    }

    private setupEventListeners() {
        console.log("Start add listener...")
        $('#searchButton').on('click', () => this.handleSearch());
        $('#resetButton').on('click', () => this.resetSearch());
        $('#myTable').on('click', '.delete-icon', (e) => this.handleDelete(e));
        $('#myTable').on('click', '.chkbx', () => this.showSelectionStatus());
        $(document).on('click', '#selection-status .delete-icon', (e) => this.handleDelete(e));
        $('#myTable').on('click', '.project-link', (e) => {
            e.preventDefault();
            const projectId = $(e.target).data('projectid');
            var entityFormOptions: Xrm.Navigation.EntityFormOptions = {};
            entityFormOptions["entityName"] = "elca_project";
            entityFormOptions["entityId"] = projectId;
            
            parent.Xrm.Navigation.openForm(entityFormOptions).then(
                function (success) {
                    console.log(success);
                },
                function (error) {
                    console.log(error);
                });
        });
    }

    private handleDelete(event: JQuery.ClickEvent) {
        event.preventDefault();
        const projectId = $(event.target).data('projectid');

        if (projectId !== "allselected") {
            this.deleteSpecificProject(projectId);
        } else {
            this.deleteSelectedProjects();
        }
    }

    private deleteSpecificProject(projectId: string) {
        const project = this.projects.find(p => p.elca_projectid === projectId);
        if (project) {
            const confirmMessage = `Are you sure you want to delete the project "${project.elca_name}"?`;
            if (confirm(confirmMessage)) {
                this.deleteProjects([projectId]);
            }
        } else {
            console.error('Project not found');
        }
    }

    private deleteSelectedProjects() {
        const selectedRows = this.projectTable.rows().nodes().filter((node: Node) => {
            return $(node).find('input[type="checkbox"].chkbx').is(':checked');
        });

        const selectedProjectIds = selectedRows.map((node: Node) => {
            return this.projectTable.row(node).data().elca_projectid;
        }).toArray();

        if (selectedProjectIds.length > 0) {
            const confirmMessage = `Are you sure you want to delete ${selectedProjectIds.length} selected project(s)?`;
            if (confirm(confirmMessage)) {
                this.deleteProjects(selectedProjectIds);
            }
        } else {
            alert('No projects selected for deletion.');
        }
    }

    private deleteProjects(projectIds: string[]) {
        Promise.all(projectIds.map(id => this.deleteProjectFromAPI(id)))
            .then(() => {
                console.log(`${projectIds.length} project(s) deleted successfully`);
                window.location.reload();
            })
            .catch(error => {
                console.error("Error deleting project(s):", error);
                alert("Project does not exist");
            });
    }

    private deleteProjectFromAPI(projectId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            parent.Xrm.WebApi.deleteRecord("elca_project", projectId).then(
                () => {
                    console.log(`Project ${projectId} deleted successfully from API`);
                    resolve();
                },
                (error) => {
                    console.error(`Error deleting project ${projectId} from API:`, error.message);
                    reject(error);
                }
            );
        });
    }

    private handleSearch() {
        const searchTerm = ($('#searchfield') as JQuery<HTMLInputElement>).val()?.toString().toLowerCase() || '';
        const statusFilter = $('.project-status').find(":selected").text();
        console.log(`status filter ${statusFilter}`);
        const filteredProjects = this.projects.filter(project => {
            const matchesSearch =
                project.elca_projectnumber.toLowerCase().includes(searchTerm) ||
                project.elca_name.toLowerCase().includes(searchTerm) ||
                project.elca_customer.toLowerCase().includes(searchTerm);

            const matchesStatus =
                statusFilter === this.projectStatusString ||
                project.elca_projectstatus === statusFilter;

            return matchesSearch && matchesStatus;
        });

        this.renderProjects(filteredProjects);
    }

    private resetSearch() {
        ($('#searchfield') as JQuery<HTMLInputElement>).val('');
        $('.project-status').val('');
        this.renderProjects(this.projects);
    }

    private renderProjects(projectsToRender: Project[] = this.projects) {
        console.log("Rendering projects...");

        const projectsData = projectsToRender.map((project: Project) => ({
            elca_projectnumber: `<a href="#" class="project-link" data-projectid="${project.elca_projectid}">${project.elca_projectnumber}</a>`,
            elca_name: project.elca_name || '',
            elca_projectstatus: project.elca_projectstatus,
            elca_customer: project.elca_customer || '',
            elca_startdate: project.elca_startdate || '',
            elca_projectid: project.elca_projectid,
        }));

        console.log("Projects data to render:", projectsData);

        if ($.fn.DataTable.isDataTable('#myTable')) {
            this.projectTable.clear().rows.add(projectsData).draw();
        } else {
            this.projectTable = new DataTable("#myTable", {
                data: projectsData,
                columns: [
                    {
                        data: null,
                        title: '<input type="checkbox" id="select-all-checkbox">',
                        defaultContent: '<input type="checkbox" class="chkbx">',
                        orderable: false
                    },
                    { data: 'elca_projectnumber', title: 'Number' },
                    { data: 'elca_name', title: 'Name' },
                    { data: 'elca_projectstatus', title: 'Status' },
                    { data: 'elca_customer', title: 'Customer' },
                    { data: 'elca_startdate', title: 'Start Date' },
                    {
                        title: 'Delete',
                        render: function (data, type, row) {
                            if (row.elca_projectstatus === 'New')
                                return `<img src="./elca_garbageicon" alt="Delete" class="delete-icon" data-projectid="${row.elca_projectid}">`;
                            return '';
                        }
                    }
                ],
                order: [[1, 'asc']],
                pageLength: 5,
                lengthChange: false,
                searching: false,
                info: false,
                pagingType: "simple_numbers"
            });
        }
        this.setupSelectAllCheckbox();
        this.initialSelectionStatus();
        console.log("Projects rendered to table");
    }

    private initialSelectionStatus() {
        $(".dt-layout-full").append(`
            <div id="selection-status">
                <span id="count-text"><span id="selected-count">0</span> items selected</span>
                <span id="delete-text">delete selected items <img src="./elca_garbageicon" alt="Delete" class="delete-icon" data-projectid="allselected"></span>
            </div>
        `);

        $("#selection-status").hide();
    }
}

$(function () {
    const app = new ProjectManagement();
});