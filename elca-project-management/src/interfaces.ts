export interface Project {
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

export interface StatusMap {
    [name: string]: string;
}