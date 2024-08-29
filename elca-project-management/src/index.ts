import './style.scss';
import DataTable from 'datatables.net-dt';
import 'datatables.net-responsive-dt';
import $ from 'jquery';
import { Project } from './interfaces';
import { mapNumberToStatus, mapStatusToNumber, formatDate } from './utils';

class ProjectManagement {
    private projects: Project[] = [];
    private projectTable: any;
    private projectStatusString: string = "Project Status";
    private isCheckAll: boolean = false;

    constructor() {
        this.initializeDataTable();
        this.setupEventListeners();
    }

    private initializeDataTable() {
        this.projectTable = new DataTable("#myTable", {
            serverSide: true,
            ajax: (data, callback, settings) => {
                this.loadProjects(data, callback);
            },
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
                    render: (data, type, row) => {
                        if (row.elca_projectstatus === 'New')
                            return `<img src="./elca_garbageicon" alt="Delete" class="delete-icon" data-projectid="${row.elca_projectid}">`;
                        return '';
                    }
                }
            ],
            order: [[1, 'asc']],
            pageLength: 20,
            lengthChange: false,
            searching: false,
            info: false,
            pagingType: "simple_numbers"
        });
    }

    private loadProjects(data: any, callback: (settings: any) => void) {
        const pageSize = data.length;
        const pageNumber = (data.start / data.length) + 1;
        const searchTerm = ($('#searchfield') as JQuery<HTMLInputElement>).val()?.toString() || '';
        const statusFilter = $('.project-status').find(":selected").text();

        let fetchXml = `<fetch mapping='logical' count='${pageSize}' page='${pageNumber}'>
            <entity name='elca_project'>
                <attribute name='elca_projectid' />
                <attribute name='elca_projectnumber' />
                <attribute name='elca_name' />
                <attribute name='elca_customer' />
                <attribute name='elca_projectstatus' />
                <attribute name='elca_startdate' />
                <order attribute='elca_projectnumber' descending='false' />
            </entity>
        </fetch>`;

        if (searchTerm) {
            fetchXml = fetchXml.replace("<entity name='elca_project'>", `<entity name='elca_project'>
                <filter type='or'>
                    <condition attribute='elca_projectnumber' operator='like' value='%${searchTerm}%' />
                    <condition attribute='elca_name' operator='like' value='%${searchTerm}%' />
                    <condition attribute='elca_customer' operator='like' value='%${searchTerm}%' />
                </filter>`);
        }

        if (statusFilter !== this.projectStatusString) {
            const statusValue = mapStatusToNumber[statusFilter];
            fetchXml = fetchXml.replace("<entity name='elca_project'>", `<entity name='elca_project'>
                <filter>
                    <condition attribute='elca_projectstatus' operator='eq' value='${statusValue}' />
                </filter>`);
        }

        const options = `?fetchXml=${encodeURIComponent(fetchXml)}&$count=true`;

        parent.Xrm.WebApi.retrieveMultipleRecords("elca_project", options).then(
            (result: any) => {
                const projects = result.entities.map((entity: any) => ({
                    elca_projectid: entity.elca_projectid,
                    elca_projectnumber: `<a href="#" class="project-link" data-projectid="${entity.elca_projectid}">${entity.elca_projectnumber}</a>`,
                    elca_name: entity.elca_name || '',
                    elca_customer: entity.elca_customer || '',
                    elca_projectstatus: mapNumberToStatus[entity.elca_projectstatus.toString()],
                    elca_startdate: formatDate(entity.elca_startdate),
                }));

                this.projects = projects;

                callback({
                    draw: data.draw,
                    recordsTotal: result.entities.length,
                    recordsFiltered: result.entities.length,
                    data: projects
                });

                // Handle Check Action for checboxes
                this.addCheckboxHandling();

                this.initialSelectionStatus();
            },
            (error) => {
                console.error("Error loading projects:", error.message);
                callback({
                    draw: data.draw,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: []
                });
            }
        );
    }


    private addCheckboxHandling() {
        // Handle Master Checkbox
        this.handleMasterCheckBox();

        //Handle Row Checkboxes
        this.handleRowCheckboxes();
    }

    private handleMasterCheckBox() {
        $('#select-all-checkbox').on('click', (event: JQuery.ClickEvent) => {
            const isChecked = (event.target as HTMLInputElement).checked;
            this.isCheckAll = isChecked;

            // Check/UnCheck row checkbox
            this.projectTable.rows().every((rowIdx: number, tableLoop: any, rowLoop: any) => {
                const node = this.projectTable.row(rowIdx).node();
                const checkbox = $(node).find('input[type="checkbox"].chkbx').get(0) as HTMLInputElement;
                if (checkbox) {
                    checkbox.checked = this.isCheckAll;
                }
            });

            // Show Selection status
            this.showSelectionStatus();
        });
    }

    private handleRowCheckboxes() {
        $('#myTable tbody').on('change', 'input[type="checkbox"]', () => {
            // Check the condition to CHECK the master checkbox
            const allCheckboxes = this.projectTable.$('input[type="checkbox"].chkbx').get();
            const allChecked = allCheckboxes.every((checkbox: HTMLInputElement) => checkbox.checked);
            this.isCheckAll = allChecked;
            const selectAllCheckbox = $('#select-all-checkbox').get(0) as HTMLInputElement;
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = this.isCheckAll;
            }

            // Show Selection status
            this.showSelectionStatus();
        });
    }

    private showSelectionStatus() {
        const numOfCheckedCB = this.projectTable.$('input.chkbx[type="checkbox"]:checked').length;
        $("#selection-status #selected-count").text(numOfCheckedCB.toString());
        if (numOfCheckedCB > 1) {
            $("#selection-status").show();
        } else {
            $("#selection-status").hide();
        }
    }

    private setupEventListeners() {
        console.log("Start add listener")
        $('#searchButton').on('click', () => this.handleSearch());
        $('#resetButton').on('click', () => this.resetSearch());
        $('#myTable').on('click', '.delete-icon', (e) => this.handleDelete(e));
        $('#myTable').on('click', '.chkbx', () => this.showSelectionStatus());
        $(document).on('click', '#select-all-checkbox', (e) => this.showSelectionStatus());
        $(document).on('click', '#selection-status .delete-icon', (e) => this.handleDelete(e));
        $('#myTable').on('click', '.project-link', (e) => {
            const projectId = $(e.target).data('projectid');
            const entityName = "elca_project";
            e.preventDefault();
            var entityFormOptions: Xrm.Navigation.EntityFormOptions = {};
            entityFormOptions["entityName"] = entityName;
            entityFormOptions["entityId"] = projectId;

            // Open the form.
            parent.Xrm.Navigation.openForm(entityFormOptions).then(
                function (success) {
                    console.log(success);
                },
                function (error) {
                    console.log(error);
                });
        });

        $(".new-page").on('click', (e) => {
            e.preventDefault();

            let pageInput: Xrm.Navigation.PageInputHtmlWebResource = {
                pageType: "webresource",
                webresourceName: "elca_projectformpage"
            };

            var navigationOptions: Xrm.Navigation.NavigationOptions = {
                target: 1,
            };

            parent.Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
                () => {
                    console.log("Navigatied");
                },
                (error) => {
                    console.log("Navigate failed {0}", error);
                }
            );
        });
    }

    private handleDelete(event: JQuery.ClickEvent) {
        event.preventDefault();
        const projectId = $(event.target).data('projectid');
        console.log(`Project ID to Delete: ${projectId.toString()}`);

        if (projectId !== "allselected") {
            this.deleteSpecificProject(projectId);
        } else {
            this.deleteSelectedProjects();
        }
        window.location.reload()
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
        let selectedProjectIds: string[];
        if (this.isCheckAll) {
            selectedProjectIds = this.projects.map(project => project.elca_projectid);
        } else {
            const selectedRows = this.projectTable.rows().nodes().filter((node: Node) => {
                return $(node).find('input[type="checkbox"].chkbx').is(':checked');
            });
            selectedProjectIds = selectedRows.map((node: Node) => {
                return this.projectTable.row(node).data().elca_projectid;
            }).toArray();
        }

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
            })
            .catch(error => {
                console.error("Error deleting project(s):", error);
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
        this.projectTable.ajax.reload();
    }

    private resetSearch() {
        ($('#searchfield') as JQuery<HTMLInputElement>).val('');
        $('.project-status').val('');
        this.projectTable.search('').order([1, 'asc']).page.len(20).draw();
    }

    private initialSelectionStatus() {
        const isExist = $("#selection-status").length;
        console.log("Is seelction status exists: {0}", isExist);
        if (!isExist) {
            $(".dt-layout-full").append(`
            <div id="selection-status">
                <span id="count-text"><span id="selected-count">0</span> items selected</span>
                <span id="delete-text">delete selected items <img src="./elca_garbageicon" alt="Delete" class="delete-icon" data-projectid="allselected"></span>
            </div>
            `);
            $("#selection-status").hide();
        }
    }
}

$(function () {
    const app = new ProjectManagement();
});