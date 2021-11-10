<h1><a href="https://connoisseurofcookies.github.io/navDataGenerator/" target="_blank">Nav Data Sheet Generator</a></h1>

<p>A simple js program that takes a set of grids and outputs a nav data sheet with the computable data complete, such as distance, bearing,rates of movement in relation to terrain/time of day/tactical situation. Optionally you can choose to input going/remarks data as well</p>

<h2>Navigation</h2>
<ul>
    <li><a href="#howToUse">How to Use</a></li>
    <li><a href="#knownIssues">Known issues</a></li>
    <li><a href="#featuresToAdd">Features to Add</a></li>
    <li><a href="#toDo">To do</a></li>
</ul>


<h2 id="howToUse">How to Use</h2>
    <li>Insert grids, 4, 6, 8 or 10 figure format </li>
    <li>Press either ADD or COMPLETE/UPDATE to complete the column/sheet, note <a href="#knownIssues"><b>Current issue with COMPLETE button</b></a></li>
    <li>Remove bottom cell with REMOVE button</li>
    <li>Download finished sheet as a Spreadsheet/JSON/TXT</li>
    <li>Printing currently has limited device/browser compatibility, particularly when it comes to style and formatting, although I intend to make future versions with more complete toolsets</li>


<h2 id="knownIssues">Known issues</h2>

<h3>UI</h3>

<ul>
    <li>Complete/update button sometimes deletes last element, probable issue with sheet indexing</li>
</ul>

<h2 id="featuresToAdd">Features/to add</h2>

<ul>
    <li>Display units of measures in the grid, example: Bearing(deg)/Bearing(mils), Distance(m)/Distance(yards)</li>
    <li>PDF downloads, currently can only print --> print to PDF and not all systems preserve styles on print</li>
    <li>Individual cell edits/updates/removes</li>
    <li>Increased grid responsiveness/mobile compatibility</li>
</ul>

<h2 id="toDo">To Do</h2>
    <ul>
        <li>Make it a PWA</li>
        <li>Port to Mobile via React-Native</li>
    </ul>
