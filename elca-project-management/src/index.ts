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

    constructor() {
        this.loadProjects();
    }

    private loadProjects() {
        const fetchXml = "?fetchXml=<fetch mapping='logical'>" +
            "<entity name='elca_project'>" +
            "<attribute name='elca_projectid' />" +
            "<attribute name='elca_projectnumber' />" +
            "<attribute name='elca_name' />" +
            "<attribute name='elca_customer' />" +
            "<attribute name='elca_projectstatus' />" +
            "<attribute name='elca_startdate' />" +
            "</entity></fetch>";

        parent.Xrm.WebApi.retrieveMultipleRecords("elca_project", fetchXml).then(
            (result) => {
                console.log("API Response:", result);
                this.projects = result.entities.map(entity => ({
                    elca_projectid: entity.elca_projectid,
                    elca_projectnumber: entity.elca_projectnumber,
                    elca_name: entity.elca_name,
                    elca_customer: entity.elca_customer,
                    elca_projectstatus: entity.elca_projectstatus,
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
    // private searchProjects() {
    //     console.log("Searching projects...");
    //     const searchInput = document.querySelector('input') as HTMLInputElement;
    //     const statusSelect = document.querySelector('select') as HTMLSelectElement;

    //     this.projectTable.search(searchInput.value).column(2).search(statusSelect.value).draw();
    // }

    // private resetSearch() {
    //     console.log("Resetting search...");
    //     const searchInput = document.querySelector('input') as HTMLInputElement;
    //     const statusSelect = document.querySelector('select') as HTMLSelectElement;

    //     searchInput.value = "";
    //     statusSelect.value = "";

    //     this.projectTable.search('').columns().search('').draw();
    // }

    private renderProjects() {
        console.log("Rendering projects...");

        // Prepare the data for DataTables
        const projectsData = this.projects.map(project => ({
            elca_projectnumber: project.elca_projectnumber || '',
            elca_name: project.elca_name || '',
            elca_projectstatus: project.elca_projectstatus || '',
            elca_customer: project.elca_customer || '',
            elca_startdate: project.elca_startdate || '',
            elca_projectid: project.elca_projectid, // Include this for the delete action
        }));

        console.log("Projects data to render:", projectsData);

        if ($.fn.DataTable.isDataTable('#myTable')) {
            // If the table already exists, clear it and add new data
            this.projectTable.clear().rows.add(projectsData).draw();
        } else {
            // If the table doesn't exist, initialize it
            this.projectTable = new DataTable("#myTable", {
                data: projectsData,
                columns: [
                    {
                        data: null,
                        defaultContent: '<input type="checkbox" name="chkbx">',
                    },
                    { data: 'elca_projectnumber', title: 'Number' },
                    { data: 'elca_name', title: 'Name' },
                    { data: 'elca_projectstatus', title: 'Status' },
                    { data: 'elca_customer', title: 'Customer' },
                    { data: 'elca_startdate', title: 'Start Date' },
                    {
                        title: 'Action',
                        render: function (data, type, row) {
                            return `<img src="./elca_garbageicon" alt="Delete" class="delete-icon" data-projectid="${row.elca_projectid}">`;
                        }
                    }
                ],
                order: [[1, 'asc']],
                pageLength: 5, 
                lengthChange: false
            });
        }
        console.log("Projects rendered to table");
    }
}

$(function () {
    const app = new ProjectManagement();
});