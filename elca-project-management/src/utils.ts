import { StatusMap } from './interfaces';

export const mapStatusToNumber: StatusMap = {
    "New": "283630000",
    "Planned": "283630001",
    "In Progress": "283630002",
    "Finished": "283630003",
    "Closed": "283630004"
};

export const mapNumberToStatus: StatusMap = {
    "283630000": "New",
    "283630001": "Planned",
    "283630002": "In Progress",
    "283630003": "Finished",
    "283630004": "Closed"
};

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
}