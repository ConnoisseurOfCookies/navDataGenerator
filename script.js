
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
    constructor(gridFrom, gridTo, timeOfDay = "day", terrain = "Open", tactical = "NonTac", gma = "0", eastWest = "-1", gridZoneDesignator = "", unitOfAngle = "mils") {
        this.gridFrom = this.convertTo10Fig(gridFrom);
        this.gridTo = this.convertTo10Fig(gridTo);

        // Modifiers
        this.timeOfDay = timeOfDay;
        this.terrain = terrain;
        this.tactical = tactical;
        this.gma = parseFloat(gma);
        this.eastWest = parseInt(eastWest);
        this.gridZoneDesignator = gridZoneDesignator;
        this.unitOfAngle = unitOfAngle;
        this.movement;

        // Data to manipulate
        this.distance;
        this.time;
        this.magBearing;

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
            return parseInt( 
                this.units[this.unitOfAngle] - this.findVectorAngle([toNorthing - fromNorthing, toEasting - fromEasting], [0, 1]) * (this.units[this.unitOfAngle] / (2*Math.PI)) 
                );
        }

    }

    findBearingMagnetic(){
        let gridBearing = this.findBearingGrid();
        return gridBearing + this.gma * this.eastWest;
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
                dataPoint.findDistance(),
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

// The nav data sheet table in  the DOM
let sheet = document.getElementById("sheet");

// The nav data sheet Data Object
let navData = new navDataSheet();

// Buttons
const add = document.getElementById("add");
const complete = document.getElementById("complete");
const remove = document.getElementById("delete"); 
const printSheet = document.getElementById("print");

// Global functions

function addColumn(nextSerial, placeholders) {
    let column = document.createElement("tr");
    column.id = "column" + nextSerial;
    
    
    let gridInput1 = document.createElement("input");
    gridInput1.type = "text";
    gridInput1.placeholder = "Grid";
    gridInput1.classList.add("gridFrom");
    gridInput1.id = "gridFromSerial" + nextSerial;
    if(placeholders){
        gridInput1.placeholder = placeholders[0];
    }

    let gridInput2 = document.createElement("input");
    gridInput2.type = "text";
    gridInput2.placeholder = "Grid";
    gridInput2.classList.add("gridTo");
    gridInput2.id = "gridToSerial" + nextSerial;
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
    column.appendChild(gridTo);
    column.appendChild(bearing);
    column.appendChild(distance);
    column.appendChild(time);
    column.appendChild(going);
    column.appendChild(remarks);

    
    
    sheet.appendChild(column);
}

function finishColumn(serial){
    let column = document.getElementById('column' + serial);
    
    let fromValue = column.childNodes[1].childNodes[0].value;
    let toValue = column.childNodes[2].childNodes[0].value;
    let goingValue = column.childNodes[6].childNodes[0].value;
    let remarksValue = column.childNodes[7].childNodes[0].value;

    let numRegex = /[^0-9]/g;
    // Validate that both grids have been filled out correctly, it's long and disgusting I know
    if(
       fromValue && toValue 
    && fromValue.length <= 10 && fromValue.length >= 4 && fromValue.length % 2 === 0
    && toValue.length <= 10 && fromValue.length >= 4 && toValue.length % 2 === 0
    && !fromValue.match(numRegex)
    && !toValue.match(numRegex) 
    ) 
    {
        // update datapoints
        let dataPoint = new navDataPoint(fromValue, toValue);

        column.childNodes[1].removeChild(column.childNodes[1].childNodes[0]);
        column.childNodes[1].innerText = fromValue;

        column.childNodes[2].removeChild(column.childNodes[2].childNodes[0]);
        column.childNodes[2].innerText = toValue;


        column.childNodes[3].innerText = dataPoint.findBearingMagnetic();
        column.childNodes[4].innerText = dataPoint.findDistance();
        column.childNodes[5].innerText = dataPoint.findTime();

    }

    column.childNodes[6].removeChild(column.childNodes[6].childNodes[0]);
    column.childNodes[6].innerText = goingValue;

    column.childNodes[7].removeChild(column.childNodes[7].childNodes[0]);
    column.childNodes[7].innerText = remarksValue;
}

function removeColumn() {
    sheet.removeChild(sheet.childNodes[sheet.childNodes.length - 1])
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

// Executes once at start
addColumn(serials, placeholders);

// Event listeners

add.addEventListener('click', () => {
    serials++;
    addColumn(serials);
    finishColumn(serials - 1);
})

remove.addEventListener('click', () => {
    if(serials === 1) return;
    removeColumn();
    serials--;
})

printSheet.addEventListener('click', () => {
    printNavDataSheet();
})
