
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
    constructor(gridFrom, gridTo, timeOfDay = "day", terrain = "Open", tactical = "NonTac", gma = "0", eastWest = "-1", gridZoneDesignator = "", unitOfAngle = "mils", unitOfMeasure = "meters") {
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
        return Math.abs((gridBearing + this.gma * this.eastWest) % this.units[this.unitOfAngle]);
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
                dataPoint.findTime()
            ]
        )
        this.serials += 1;
    }
        
    outputSheet() {
        return this.sheet;
    }
}

/* DOM manipulation */

// Global variables
let serials = 1;
let placeholders = ["321456", "312465", "5600", "1272", "15"];
let settings = {
    timeOfDay: 'day',
    terrain: "Open",
    tactical: "NonTac",
    gma: "0",
    eastWest: "-1",
    gridZoneDesignator: "",
    unitOfAngle: "mils",
    unitOfMeasure: "meters"
}

// The nav data sheet table in  the DOM
let sheet = document.getElementById("sheet");

// The nav data sheet Data Object
let navData = new navDataSheet();

// Buttons
const add = document.getElementById("add");
const complete = document.getElementById("complete");
const remove = document.getElementById("delete"); 
const printSheet = document.getElementById("print");
const applyChanges = document.getElementById("applyChanges");

// Global functions

function addColumn(nextSerial, placeholders) {
    let column = document.createElement("tr");
    column.id = "column" + nextSerial;
    
    
    let gridInput1 = document.createElement("input");
    gridInput1.type = "text";
    gridInput1.placeholder = "Grid";
    gridInput1.classList.add("gridFrom");
    //gridInput1.id = "gridFromSerial" + nextSerial;
    if(placeholders){
        gridInput1.placeholder = placeholders[0];
    }

    let gridInput2 = document.createElement("input");
    gridInput2.type = "text";
    gridInput2.placeholder = "Grid";
    gridInput2.classList.add("gridTo");
    //gridInput2.id = "gridToSerial" + nextSerial;
    if(placeholders){
        gridInput2.placeholder = placeholders[1];
    }

    let textArea1 = document.createElement("input");
    textArea1.type = "text";
    textArea1.title = "going";
    textArea1.placeholder = "Going";
    textArea1.classList.add("gridFrom");
    
    
    let textArea2 = document.createElement("input");
    textArea2.type = "text";
    textArea2.title = "remarks";
    textArea2.placeholder = "Remarks";
    
    // Nav data sheet table elements
    let serial = document.createElement("td");
    serial.style.width = "20px";
    serial.style.textAlign = 'center';
    let gridFrom = document.createElement("td");
    let gridTo = document.createElement("td");
    let bearing = document.createElement("td");
    let distance = document.createElement("td");
    let time = document.createElement("td");
    let going = document.createElement("td")
    let remarks = document.createElement("td");

    if(placeholders){
        bearing.innerHTML = placeholders[2];
    }

    if(placeholders){
        distance.innerHTML = placeholders[3];
    }

    if(placeholders){
        time.innerHTML = placeholders[4];
    }

    serial.innerHTML = nextSerial;

    gridFrom.appendChild(gridInput1);

    gridTo.appendChild(gridInput2);

    going.appendChild(textArea1);

    remarks.appendChild(textArea2);
    
    column.appendChild(serial);
    column.appendChild(gridFrom);
    column.childNodes[1].id = "gridFromSerial" + nextSerial;
    column.appendChild(gridTo);
    column.childNodes[2].id = "gridToSerial" + nextSerial;
    column.appendChild(bearing);
    column.appendChild(distance);
    column.appendChild(time);
    column.appendChild(going);
    column.appendChild(remarks);

    
    
    sheet.appendChild(column);
}

function isValidGrid(grid){
    let numRegex = /[^0-9]/g;

    return  (grid // Is not null/undefined
    && grid.length <= 10 && grid.length >= 4 && grid.length % 2 === 0 // gridLength is legal and is an even number
    && !grid.match(numRegex)) // is a number

} 

function completeSheet() {
    for(let i = 0; i < sheet.children.length; i++){
        let s = i + 1;

        completeColumn(s);
    }

    for(let i = 0; i < sheet.children.length; i++){
        let s = i + 1;

        if(sheet.children[i].children[1].children[0]){
            
            removeColumn(s);
            i--;
        }
    }
    serials = sheet.children.length;
    
    for(let i = 0; i < sheet.children.length; i++){
        let s = i + 1;

        sheet.children[i].children[0].innerText = s;
    }
}

function completeColumn(s) {
    let column = sheet.children[s - 1];
    if(!column.children[1].children[0] && !column.children[2].children[0]) return;
    let fromValue = column.children[1].children[0].value.replace(/\s/g, "");
    let toValue = column.children[2].children[0].value.replace(/\s/g, "");
    let goingValue;
    let remarksValue;
    if(column.children[6].children[0]) goingValue = column.children[6].children[0].value;
    
    if(column.children[7].children[0]) remarksValue = column.children[7].children[0].value;

    if(isValidGrid(fromValue) && isValidGrid(toValue)){
        column.children[0].innerHTML = s;

        let dataPoint = new navDataPoint(
            fromValue, 
            toValue, 
            settings.timeOfDay, 
            settings.terrain, 
            settings.tactical, 
            settings.gma,
            settings.eastWest,
            settings.gridZoneDesignator,
            settings.unitOfAngle,
            settings.unitOfMeasure
        );

        completeCell("gridFromSerial" + s, fromValue);

        completeCell("gridToSerial" + s, toValue);

        column.children[3].innerText = dataPoint.findBearingMagnetic();
        column.children[4].innerText = dataPoint.distanceWithUnitsOfMeasure();
        column.children[5].innerText = dataPoint.findTime();

        if(column.children[6].children[0]){
            column.children[6].removeChild(column.children[6].children[0]);
            column.children[6].innerText = goingValue;
        }

        if(column.children[7].children[0]){
            column.children[7].removeChild(column.children[7].children[0]);
            column.children[7].innerText = remarksValue;
        }
        return;

    }


    if(column.children[6].children[0]) {
        column.children[6].removeChild(column.children[6].children[0])
        column.children[6].innerText = goingValue;
    }

    if(column.children[7].children[0]){
        column.children[7].removeChild(column.children[7].children[0]);
        column.children[7].innerText = remarksValue;
    }
}

function removeColumn(s) {
    if(s){
        sheet.removeChild(sheet.children[s - 1])
        return;
    }

    sheet.removeChild(sheet.childNodes[sheet.childNodes.length - 1]);

    
}

function completeCell(id, newValue) {
    // Cell has child Input and it has a value
    let cell = document.getElementById(id);

    cell.removeChild(cell.childNodes[0]);
    cell.innerText = newValue;

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

// Executes once at start
addColumn(1, placeholders);

// Event listeners

add.addEventListener('click', () => {
    addColumn(serials +1);
    if(serials === 0){
        serials = sheet.children.length;
        return;
    }

    completeColumn(serials);
    serials = sheet.children.length;

})

remove.addEventListener('click', () => {
    if(serials === 0) return;
    removeColumn();
    serials = sheet.children.length;
})


applyChanges.addEventListener("click", () => {
    const timeOfDay = document.getElementById("timeOfDaySelector");
    const terrain = document.getElementById("terrSelect");
    const tacSituation = document.getElementById("tacNonTac");
    const unitOfAngle = document.getElementById("unitOfAngle");
    const unitsOfMeasure = document.getElementById("unitsOfMeasure");
    const eastWest = document.getElementById('eastWest');
    const gridMA = document.getElementById('gridMA');

    settings.timeOfDay = timeOfDay.value;
    settings.terrain = terrain.value;
    settings.tactical = tacSituation.value;
    settings.unitOfAngle = unitOfAngle.value;
    settings.unitOfMeasure = unitsOfMeasure.value;
    eastWest.value === "east" ? settings.eastWest = "-1" : settings.eastWest = "1";
    settings.gma = gridMA.value;


    dropDownApplyChanges('timeOfDaySelector');
    dropDownApplyChanges('terrSelect');
    dropDownApplyChanges('tacNonTac');
    dropDownApplyChanges('unitOfAngle');
    dropDownApplyChangesOptgroup('unitsOfMeasure');
    dropDownApplyChanges('eastWest');
    gridMA.placeholder = gridMA.value;

})

complete.addEventListener('click', () => {
    completeSheet();
    serials = sheet.children.length;
    
})
