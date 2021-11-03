
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

let sheet = document.getElementById("sheet");


for(let j = 0; j < 3; j++){
    let column = document.createElement("tr");

    for(let i = 0; i < 3; i++){
        let row = document.createElement('td');
        
        row.innerText = "HO"
        column.appendChild(row);
    }
    sheet.appendChild(column);

}


