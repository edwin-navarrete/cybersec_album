

function sanitizeDate(date:string) {
    let formattedDate: string | undefined;
    // Check if the date is in "DD/MM/YYYY" format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const parts = date.split('/');
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // Check if the date is in "YYYY-MM-DD" format
        else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        formattedDate = date;
    }            
    return formattedDate
}

export {sanitizeDate}
