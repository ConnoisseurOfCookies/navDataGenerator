
/**
 * @param {string} gridFrom - Start location, can be 2, 4, 6, 8 or 10 figure grid
 * @param {string} gridTo - Same as gridFrom
 * @param {string} timeOfDay - day or night, lowercase
 * @param {string} terrain - Open, Close or Xtreme. Always uppercase
 * @param {string} tactical - Tac or NonTac. Always uppercase
 * @param {string} gma - Grid-Magnetic Angle
 * @param {string} eastWest - GMA easterly or westerly
 * @param {string} gridZoneDesignator - Optional
 * @param {string} unitOfAngle  - mils or degrees. Lowercase.
 * 
 * Outputs calculatable datapoints for a navDataSheet that can be derived from two grids
 * 
 */
class navDataPoint {
    constructor(gridFrom, gridTo, timeOfDay = "day", terrain = "Open", tactical = "NonTac", gma = "0", eastWest = "-1", gridZoneDesignator = "", unitOfAngle = "mils", unitOfMeasure = "meters", timeFormat = ":mm") {
        this.gridFrom = this.convertTo10Fig(gridFrom);
        this.gridTo = this.convertTo10Fig(gridTo);

        // Modifiers
        this.timeOfDay = timeOfDay;
        this.terrain = terrain;
        this.tactical = tactical;
        gma === "" ? this.gma = 0 : this.gma = parseFloat(gma);
        
        this.eastWest = parseInt(eastWest);
        this.gridZoneDesignator = gridZoneDesignator;
        this.unitOfAngle = unitOfAngle;
        this.movement;

        this.unitOfMeasure = unitOfMeasure;

        this.timeFormat = timeFormat;
        // Constants
        this.ratesOfMovement = {
            dayOpenNonTac: 5000,
            dayCloseNonTac: 3000,
            dayXtremeNonTac: 1500,
            dayOpenTac: 2000,
            dayCloseTac: 1000,
            dayXtremeTac: 500,
            nightOpenNonTac: 2500,
            nightCloseNonTac: 1500,
            nightXtremeNonTac: 750,
            nightOpenTac: 1000,
            nightCloseTac: 500,
            nightXtremeTac: 250
        }

        this.units = {
            mils: 6400,
            degrees: 360
        }

        this.unitsOfMeasure = {
            meters: 1,
            kilometers: 0.001,
            feet: 3.28084,
            yards: 1.093613333,
            miles: 0.00062137121212119323429
        }
    }

    /**
     * 
     * @param {string} grid - Number between 00 00, 4 fig grid or gridsquare, and 99999 99999, 10 fig grid 
     * @returns {string} 10 fig grid
     */
    convertTo10Fig(grid) {
        let gridOut = grid;

        try{
            // Validate grid
            if(gridOut.length > 10){
                throw new RangeError("Value out of range: Grid is too long");
            }
            if(gridOut.length < 4){
                throw new RangeError("Value out of range: Grid is too short");
            }
            if(gridOut.length % 2 !== 0){
                throw new RangeError("Invalid value: Length of grid has to be 2, 4, 6, 8 or 10 digits");
            }

        } catch(e){
            console.log(e);
            return e;
        }
        
        while(gridOut.length < 10){
            let northing = gridOut.slice(0, gridOut.length / 2);
            let easting = gridOut.slice(gridOut.length / 2);
            
            northing = northing + "0";
            easting = easting + "0";
            gridOut = northing + easting;
        }

        return gridOut;
    }


    findDistance(){
        let from = this.gridFrom;
        let to = this.gridTo;

        let fromNorthing = parseInt( from.slice(0, from.length / 2) );
        let fromEasting = parseInt( from.slice(from.length / 2) );

        let toNorthing = parseInt( to.slice(0, to.length / 2) );
        let toEasting = parseInt( to.slice(to.length / 2) );

        // Pythagoras theorem, rounded to integer

        return parseInt( Math.sqrt(Math.pow( Math.abs(fromNorthing - toNorthing), 2 ) + Math.pow( Math.abs(toEasting - fromEasting), 2 ) ));
        

    }

    distanceWithUnitsOfMeasure() {
        if(this.unitOfMeasure === "kilometers" || this.unitOfMeasure === "miles"){
            return parseFloat( this.findDistance() * this.unitsOfMeasure[this.unitOfMeasure]).toFixed(2);

        }
        
        return parseInt( this.findDistance() * this.unitsOfMeasure[this.unitOfMeasure]);
    }

    setMovement(){
        this.movement = this.ratesOfMovement[this.timeOfDay + this.terrain + this.tactical];
    }

    findTime(){
        this.setMovement();
        let distance = this.findDistance();
        return parseInt( (distance / this.movement) * 60);
    }

    convertMMtoHM(min){
        let m = parseInt(min);

        let zero = "";
        if(m % 60 < 10) zero = "0";
        let hourTime = (Math.floor(m / 60)).toString() // 1
         + ":" + zero + // 3
         (m % 60).toString(); // 2

         return hourTime;

    }

    convertHMtoMM(h){
        let minutes = parseInt(h[h.length-2] + h[h.length-1]);
        console.log(minutes + " minutes")
        let hours = '';
        for(let i = 0; i <= h.length-4; i++){
            hours += h[i];
        }
        
        hours = parseInt(hours);
        return ((parseInt(hours) * 60 + minutes).toString()).toString();
    }

    getFormattedTime(){
        // Hour time, 1: Get number of hours 2: get number of minutes 3: are there more than 10 minutes
        let zero = "";
        if(parseInt(this.findTime()) % 60 < 10) zero = "0";
        let hourTime = (Math.floor(parseFloat(this.findTime()) / 60)).toString() // 1
         + ":" + zero + // 3
         (parseInt(this.findTime()) % 60).toString(); // 2

        switch (this.timeFormat) {
            case ":mm":
                return this.findTime();
            case "h:mm":
                return hourTime;
            default:
                break;
        }
    }

    findBearingGrid(){
        let from = this.gridFrom;
        let to = this.gridTo;

        let fromNorthing = parseInt( from.slice(0, from.length / 2) );
        let fromEasting = parseInt( from.slice(from.length / 2) );

        let toNorthing = parseInt( to.slice(0, to.length / 2) );
        let toEasting = parseInt( to.slice(to.length / 2) );

        if(toNorthing - fromNorthing >=  0) {
            return parseInt( 
                this.findVectorAngle([toNorthing - fromNorthing, toEasting - fromEasting], [0, 1]) * (this.units[this.unitOfAngle] / (2*Math.PI)) 
                );
        }

        if(toNorthing - fromNorthing < 0){ 
            return  parseInt( 
                this.units[this.unitOfAngle] - this.findVectorAngle([toNorthing - fromNorthing, toEasting - fromEasting], [0, 1]) * (this.units[this.unitOfAngle] / (2*Math.PI)) 
                );
        }

    }

    findBearingMagnetic(){
        let gridBearing = this.findBearingGrid();
        let factor = this.gma * this.eastWest;
        let unit = this.units[this.unitOfAngle];

        if(factor < 0 && gridBearing + factor < 0){
            return (gridBearing + factor + unit) % unit;
        }
        if(factor > 0 && gridBearing + factor > unit){
            return (gridBearing + factor - unit) % unit;
        }

        return (gridBearing + this.gma * this.eastWest) % unit;
    }

/**
 * 
 * @param {number[]} v1 - 2d numerical vector
 * @param {number[]} v2 - 2d numerical vector
 * @returns {number} angle - The angle between v1 and v2 in radians
 */
    findVectorAngle(v1, v2){

        let dotProduct = v1[0]*v2[0] + v1[1]*v2[1];
        let vMagnitude1 = Math.sqrt(Math.pow(v1[0], 2) + Math.pow(v1[1], 2));
        let vMagnitude2 = Math.sqrt(Math.pow(v2[0], 2) + Math.pow(v2[1], 2));

        let angle = Math.acos((dotProduct) / (vMagnitude1*vMagnitude2));

        return angle;  
    }

}



/**
 * - Compiles and outputs a navDataSheet
 */
class navDataSheet {
    constructor() {
        this.defaults = [...arguments];
        this.serials = 1;
        this.sheet = [];
    }
    
    addGoing(serial, going){
        for(let i = 0; i < this.sheet.length; i++){
            if(this.sheet[i][0] === serial){
                this.sheet[i][6] = going;
                return;
            }
        }
        return;
    }

    addRemark(serial, remark){
        for(let i = 0; i < this.sheet.length; i++){
            if(this.sheet[i][0] === serial){
                this.sheet[i][7] = remark;
                return;
            }
        }
        return;
    }

    addDataPoint() {
        let dataPoint = new navDataPoint(...arguments)
        this.sheet.push(
            [
                this.serials,
                dataPoint.gridFrom,
                dataPoint.gridTo,
                dataPoint.findBearingMagnetic(),
                dataPoint.distanceWithUnitsOfMeasure(),
                dataPoint.getFormattedTime()
            ]
        )
        this.serials += 1;
    }
        
    outputSheet() {
        return this.sheet;
    }
}

// New String methods
String.prototype.splitInHalf = function ()  {
    return this.slice(0, this.length/2) + " " + this.slice(this.length/2);
}

String.prototype.removeAllWhitespace = function () {
    return this.replace(/\s/g, "");
}

/* DOM manipulation */

// Global variables
let placeholders = ["321 456", "312 465", "5600", "1272", "15"];
let settings = {
    timeOfDay: 'day',
    terrain: "Open",
    tactical: "NonTac",
    gma: "0",
    eastWest: "-1",
    gridZoneDesignator: "",
    unitOfAngle: "mils",
    unitOfMeasure: "meters",
    timeFormat: ":mm"
}
let title = "";

// The nav data sheet table in  the DOM
let sheet = document.getElementById("sheet");

// The nav data sheet Data Object
let navData = new navDataSheet();

// Buttons
const add = document.getElementById("add");
const editTitle = document.getElementById("editTitle");
const remove = document.getElementById("delete"); 
const printSheet = document.getElementById("print");
const applyChanges = document.getElementById("applyChanges");

const warningBox = document.getElementById("warning");
const tableTitle = document.getElementById('tableTitle');



// Input textareas
const serialSelector = document.getElementById("serialSelector");
const fromInput = document.getElementById("fromInput");
const toInput = document.getElementById("toInput");
const goingInput = document.getElementById("goingInput");
const remarksInput = document.getElementById("remarksInput");

// Global functions

function addColumn(placeholders) {
    let column = document.createElement("tr");
    column.addEventListener('mouseover', () => {
        column.style.cursor = "pointer";
    })
    
     
    let serial = serialSelector.value;
    let from = fromInput.value;
    let to = toInput.value;
    let going = goingInput.value; 
    let remarks = remarksInput.value;
    
    
   
    
    // Nav data sheet table elements plus some styling
    let serialCell = document.createElement("td");
    serialCell.style.textAlign = "center";
    serialCell.style.width = "2ch"

    let gridFromCell = document.createElement("td");
    gridFromCell.style.width = "12ch";
    gridFromCell.style.textAlign = "center";
    let gridToCell = document.createElement("td");
    gridToCell.style.width = "12ch";
    gridToCell.style.textAlign = "center";

    let bearingCell = document.createElement("td");
    let distanceCell = document.createElement("td");
    let timeCell = document.createElement("td");
    let goingCell = document.createElement("td");
    let remarksCell = document.createElement("td");

    // Add placeholders at start
    if(placeholders){
        serialCell.innerText = "1";
        gridFromCell.innerText = placeholders[0];
        gridToCell.innerText = placeholders[1];
        bearingCell.innerText = placeholders[2];
        distanceCell.innerText = placeholders[3];
        timeCell.innerText = placeholders[4];
        goingCell.innerText = "Long, Hard and Gutwrenching";
        remarksCell.innerText = "View is quite nice, totally worth it";
        
        column.appendChild(serialCell);
        column.appendChild(gridFromCell);
        column.appendChild(gridToCell);
        column.appendChild(bearingCell);
        column.appendChild(distanceCell);
        column.appendChild(timeCell);
        column.appendChild(goingCell);
        column.appendChild(remarksCell);

        column.addEventListener('click', (e) => {
            serialSelector.value = serial;    
            fromInput.value = column.children[1].innerText;
            toInput.value = column.children[2].innerText;
            goingInput.value = column.children[6].innerText;
            remarksInput.value = column.children[7].innerText;
        })

        sheet.appendChild(column);
        return;
    }
    
    /* Deal with Serial */

    // This serial is the first serial
    
    if(serialSelector.length === 1){
        
        let serialOption = document.createElement("option");
        serialOption.value = "2";
        serialOption.innerText = "2";
        serialSelector.appendChild(serialOption);


        serialCell.innerText = "2";
       editColumn(
           {cell: serialCell, value: serial}, 
           {cell: gridFromCell, value: from}, 
           {cell: gridToCell, value: to},
           {cell: bearingCell},
           {cell: distanceCell},
           {cell: timeCell},
           {cell: goingCell, value: going},
           {cell: remarksCell, value: remarks},
           sheet.children[parseInt(serial) - 1],
           true
       )

        
        sheet.children[serial-1] = column;

        serialSelector.value = (parseInt(serial) + 1).toString();
        fromInput.value = to;
        toInput.value = "";
        toInput.placeholder = "Grid To";
        goingInput.value = "";
        goingInput.placeholder = "Going";
        remarksInput.value = "";
        remarksInput.placeholder = "Remarks";
        return;
    }

    // Not first serial, but is an edit
    if(parseInt(serial) <= sheet.childNodes.length-1){

       editColumn(
           {cell: serialCell, value: serial}, 
           {cell: gridFromCell, value: from}, 
           {cell: gridToCell, value: to},
           {cell: bearingCell},
           {cell: distanceCell},
           {cell: timeCell},
           {cell: goingCell, value: going},
           {cell: remarksCell, value: remarks},
           sheet.children[parseInt(serial) - 1],
           true
       )


    
        return;
    }

    // This serial is not the first serial and is not an edit
    if(parseInt(serial) > sheet.children.length){

        let serialOption = document.createElement("option");
        serialOption.value = (parseInt(serial) + 1).toString();
        serialOption.innerText = (parseInt(serial) + 1).toString();
        serialSelector.appendChild(serialOption);

        serialCell.innerText = serial;
        
        editColumn(
            {cell: serialCell, value: serial}, 
            {cell: gridFromCell, value: from}, 
            {cell: gridToCell, value: to},
            {cell: bearingCell},
            {cell: distanceCell},
            {cell: timeCell},
            {cell: goingCell, value: going},
            {cell: remarksCell, value: remarks},
            column,
            
        )

        serialSelector.value = (parseInt(serial) + 1).toString();
        fromInput.value = to;
        toInput.value = "";
        toInput.placeholder = "Grid To";
        goingInput.value = "";
        goingInput.placeholder = "Going";
        remarksInput.value = "";
        remarksInput.placeholder = "Remarks";

    }

    
    
    column.addEventListener('click', (e) => {
        serialSelector.value = serial;    
        fromInput.value = column.children[1].innerText;
        toInput.value = column.children[2].innerText;
        goingInput.value = column.children[6].innerText;
        remarksInput.value = column.children[7].innerText;
    })
    

    sheet.appendChild(column);
}

function editColumn(serial, from, to, bearing, distance, time, going, remarks, column, isEdit = false){

    serial.cell.innerText = serial.value;

    from.value = from.value.removeAllWhitespace();
    to.value = to.value.removeAllWhitespace();

    from.cell.innerText = from.value.splitInHalf();
    to.cell.innerText = to.value.splitInHalf();

    fromVal = from.value;
    toVal = to.value;

    if(isValidGrid(fromVal) && isValidGrid(toVal)){
        let dataPoint = new navDataPoint(
            fromVal, 
            toVal, 
            settings.timeOfDay, 
            settings.terrain, 
            settings.tactical, 
            settings.gma,
            settings.eastWest,
            settings.gridZoneDesignator,
            settings.unitOfAngle,
            settings.unitOfMeasure,
            settings.timeFormat
        );


        bearing.value = dataPoint.findBearingMagnetic();
        bearing.cell.innerText = bearing.value;

        distance.value = dataPoint.distanceWithUnitsOfMeasure();
        distance.cell.innerText = distance.value;

        time.value = dataPoint.getFormattedTime();
        time.cell.innerText = time.value;

        going.cell.innerText = going.value;
        remarks.cell.innerText = remarks.value;
    }

    if(isEdit){
        column.children[1].innerText = from.value.splitInHalf();
        column.children[2].innerText = to.value.splitInHalf();
        column.children[3].innerText = bearing.value;
        column.children[4].innerText = distance.value;
        column.children[5].innerText = time.value;
        column.children[6].innerText = going.value;
        column.children[7].innerText = remarks.value;
        return
    }



    
    column.appendChild(serial.cell);
    column.appendChild(from.cell);
    column.appendChild(to.cell);
    column.appendChild(bearing.cell);
    column.appendChild(distance.cell);
    column.appendChild(time.cell);
    column.appendChild(going.cell);
    column.appendChild(remarks.cell);

}


function isValidGrid(grid){
    let numRegex = /[^0-9]/g;

    return  (grid // Is not null/undefined
    && grid.length <= 10 && grid.length >= 4 && grid.length % 2 === 0 // gridLength is legal and is an even number
    && !grid.match(numRegex)) // is a number

} 

function removeColumn() {
    if(sheet.children.length === 1){
        return;
    }

    sheet.removeChild(sheet.childNodes[sheet.childNodes.length - 1]);

    
}



function printNavDataSheet() {
    let printWindow = window.open('', '', 'height=400, widht=800');
    printWindow.document.write('<html><head><title>Table Contents</title>');


    printWindow.document.write('<link rel="stylesheet" href="assets/css/main.css" />');

    
    printWindow.document.write('</head>');

    printWindow.document.write('<body>');

    let tableToPrint = document.getElementById('fullTable').innerHTML;
    printWindow.document.write(tableToPrint);
    printWindow.document.write('</body>');

    printWindow.document.write('</html>');
    printWindow.print(); 
    

}

function dropDownApplyChanges(id) {
    let selectElement = document.getElementById(id);
    let val = selectElement.value;

    for(let i = 0; i < selectElement.children.length; i++){
        if(val === selectElement.children[i].value) {
            selectElement.children[i].setAttribute('selected', "true");
            continue;
        }
        selectElement.children[i].removeAttribute('selected');
        
    }
}

function dropDownApplyChangesOptgroup(id) {
    let selectElement = document.getElementById(id);
    let val = selectElement.value;

    for(let i = 0; i < selectElement.children.length; i++){

        for(let j = 0; j < selectElement.children[i].children.length; j++){
            if(selectElement.children[i].children[j].value === val){

                selectElement.children[i].children[j].setAttribute('selected', 'true');
                continue;
            }
            if(selectElement.children[i].children[j].value !== val){
                selectElement.children[i].children[j].removeAttribute('selected');
            }

            
        }
    }
}

function formatIsHM(time){
    return time[time.length - 3] === ":";
}

function handleTimeFormatChange(index, data){
    let row = sheet.children[index];
    let time = row.children[5].innerText;
    // Handle if no change
    if(
                (formatIsHM(time) && settings.timeFormat === "h:mm") 
            ||  (!formatIsHM(time) && settings.timeFormat === ":mm") 
            ||  (!formatIsHM(time) && settings.timeFormat === ":mm")
        )
    {
        return;
    }

    // Handle if format is going from mm to h:mm
    if( (!formatIsHM(time) && settings.timeFormat === "h:mm"))
    {
        time = data.convertMMtoHM(time);
        row.children[5].innerText = time;
        return;
    }

    // Handle if format is going from h:mm to mm
    if(formatIsHM(time) && settings.timeFormat === ":mm"){
        time = data.convertHMtoMM(time);
        row.children[5].innerText = time;
        return;
    }
}

function updateUnitsAll(index){
    let row = sheet.children[index];
    let data = new navDataPoint(row.children[1].innerText.removeAllWhitespace(), row.children[2].innerText.removeAllWhitespace(), settings.timeOfDay, settings.terrain, settings.tactical, settings.gma, settings.eastWest, settings.gridZoneDesignator, settings.unitOfAngle, settings.unitOfMeasure, settings.timeFormat);
    
    row.children[3].innerText = data.findBearingMagnetic();
    row.children[4].innerText = data.distanceWithUnitsOfMeasure();
    
    
    handleTimeFormatChange(index, data);
}


// Executes once at start
addColumn(placeholders);

// Event listeners

add.addEventListener('click', () => {
    let from = fromInput.value.removeAllWhitespace();
    let to = toInput.value.removeAllWhitespace();
    let warningMessage = "";

    // Validation
    if(!isValidGrid(from) || !isValidGrid(to)){
        if(!isValidGrid(from) && !isValidGrid(to)){
            warningMessage += "Please Insert Valid Grids: "
        }
        if(!isValidGrid(from)){
            if(from.length === 0){
                warningMessage += 'The "From" value has to be given. ';
            } else if(from.length < 4 ){
                warningMessage += 'The "From" value has to be at least a 4 figure grid. ';
            } else if(from.length > 10){
                warningMessage += 'The "From" value cannot be more than a 10 figure grid. ';
            } else if(from.length % 2 !== 0){
                warningMessage += 'Ensure you typed in the correct grid, it has to be either a 4, 6, 8 or 10 figure grid. ';
            }
            let numRegex = /[^0-9]/g;
            if(!from.match(numRegex) && from.length !== 0){
                warningMessage += 'Only numbers and whitespace are valid entries. ';
            }

            fromInput.style.borderColor = "red";
            warningBox.innerText = warningMessage;
        }

        if(!isValidGrid(to)){
            if(to.length === 0){
                warningMessage += 'The "To" value has to be given. ';
            } else if(to.length < 4 ){
                warningMessage += 'The "To" value has to be at least a 4 figure grid. ';
            } else if(to.length > 10){
                warningMessage += 'The "To" value cannot be more than a 10 figure grid. ';
            } else if(to.length % 2 !== 0){
                warningMessage += 'Ensure you typed in the correct grid, it has to be either a 4, 6, 8 or 10 figure grid. ';
            }
            let numRegex = /[^0-9]/g;
            if(!to.match(numRegex) && to.length !== 0){
                warningMessage += 'Only numbers and whitespace are valid entries. ';
            }

            toInput.style.borderColor = "red";
            warningBox.innerText = warningMessage;
        }
        return;
    }
    warningBox.innerText = "";

    addColumn();
})

remove.addEventListener('click', () => {
    if(sheet.children.length === 1) return;
    removeColumn();
    serials = sheet.children.length;
    serialSelector.removeChild(serialSelector.children[serialSelector.children.length - 1])
})


applyChanges.addEventListener("click", () => {
    const timeOfDay = document.getElementById("timeOfDaySelector");
    const terrain = document.getElementById("terrSelect");
    const tacSituation = document.getElementById("tacNonTac");
    const unitOfAngle = document.getElementById("unitOfAngle");
    const unitsOfMeasure = document.getElementById("unitsOfMeasure");
    const eastWest = document.getElementById('eastWest');
    const gridMA = document.getElementById('gridMA');
    const timeFormat = document.getElementById('timeFormat');

    settings.timeOfDay = timeOfDay.value;
    settings.terrain = terrain.value;
    settings.tactical = tacSituation.value;
    settings.unitOfAngle = unitOfAngle.value;
    settings.unitOfMeasure = unitsOfMeasure.value;
    eastWest.value === "east" ? settings.eastWest = "-1" : settings.eastWest = "1";
    settings.gma = gridMA.value;
    settings.timeFormat = timeFormat.value;


    dropDownApplyChanges('timeOfDaySelector');
    dropDownApplyChanges('terrSelect');
    dropDownApplyChanges('tacNonTac');
    dropDownApplyChanges('unitOfAngle');
    dropDownApplyChangesOptgroup('unitsOfMeasure');
    dropDownApplyChanges('eastWest');
    gridMA.placeholder = gridMA.value;
    dropDownApplyChanges('timeFormat');

    const beaHeader = document.getElementById("bearingHeader");
    const disHeader = document.getElementById("distanceHeader");
    const timHeader = document.getElementById("timeHeader");

    switch (settings.timeFormat) {
        case ":mm":
                timHeader.innerHTML = "Time<br>(:mm)";
            break;
        case "h:mm":
                timHeader.innerHTML = "Time<br>(h:mm)";
        default:
            break;
    }

    switch (settings.unitOfAngle) {
        case "degrees":
                beaHeader.innerHTML = "Bearing<br>(deg)";
            break;
        case "mils":
                beaHeader.innerHTML = "Bearing<br>(mils)";
            break;
        default:
            break;
    }

    switch (settings.unitOfMeasure) {
        case "meters":
            disHeader.innerHTML = "Distance<br>(m)";
            break;
        case "yards":
            disHeader.innerHTML = "Distance<br>(yards)";
            break;
        case "kilometers":
            disHeader.innerHTML = "Distance<br>(km)";
            break;
        case "miles":
            disHeader.innerHTML = "Distance<br>(miles)";
            break;
        case "feet":
            disHeader.innerHTML = "Distance<br>(feet)";
            break;
        default:
            break;
    }

    for(let i = 0; i < sheet.children.length; i++){
        updateUnitsAll(i);
    }
})

editTitle.addEventListener('click', () => {

        let oldTitle = document.getElementById('printTitle').innerText;
        tableTitle.innerHTML = `<input type="text" title="docTitle" id="docTitle" style="width: 50%; text-align: center" value="${oldTitle}" />`;
        let docTitle = document.getElementById('docTitle');
        docTitle.focus();    
        

        docTitle.addEventListener('focusout', () => {
            let newTitle = docTitle.value;
            tableTitle.innerHTML = `<h4 id="printTitle">${newTitle}</h4>`
        })

})

fromInput.addEventListener('focusout', () => {
    let from = fromInput.value.removeAllWhitespace();

    if(!isValidGrid(from) && from.length !== 0){
        fromInput.style.borderColor = "red";
        fromInput.style.boxShadow = "red";

        return;
    }

    if(from.length === 0){
        fromInput.style.borderColor = "rgba(144, 144, 144, 0.2)";
        return;
    }

    fromInput.style.borderColor = "#4dbea0";
})

fromInput.addEventListener('keydown', () => {
    let from = fromInput.value.removeAllWhitespace();
    
    if(isValidGrid(from)){
        fromInput.style.borderColor = "#4dbea0";
    }
})

toInput.addEventListener('focusout', () => {
    let to = toInput.value.removeAllWhitespace();

    if(!isValidGrid(to) && to.length !== 0){
        toInput.style.borderColor = "red";
        return;
    }

    if(to.length === 0){
        toInput.style.borderColor = "rgba(144, 144, 144, 0.2)";
        return;
    }

    toInput.style.borderColor = "#4dbea0";
})

toInput.addEventListener('change', () => {
    let to = toInput.value.removeAllWhitespace();
    
    if(isValidGrid(to)){
        toInput.style.borderColor = "#4dbea0";
    }
})