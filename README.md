# DevExtreme_DataGridToPDF

---

#### Requirements

[jsPDF](https://github.com/MrRio/jsPDF)

[jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

---

#### Export module

[exportDxDataGrid.js](https://github.com/KuznetsovVN/DevExtreme_DataGridToPDF/blob/master/js/exporter/exportDxDataGrid.js)

---

Check out the [playground](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/playground.html) and [examples](https://github.com/KuznetsovVN/DevExtreme_DataGridToPDF/tree/master/demos/dxDataGrid/jsPDF).

---

## How to use

##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {

        var pdfDoc = new jsPDF('p', 'pt', 'a4');

        exportDataGrid(pdfDoc, e.component).then(function () {
            pdfDoc.save("filePDF.pdf");
        });

        e.cancel = true;
    } 
};  
```

---

## How to cusomize a table

##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {

        var pdfDoc = new jsPDF('p', 'pt', 'a4');

		var options = {
			margin: {
				top: 15,
				left: 15
			},
			tableWidth: 300,
			// ...
		};

        exportDataGrid(pdfDoc, e.component, null, options)
			.then(function () {
				pdfDoc.save("filePDF.pdf");
			});

        e.cancel = true;
    } 
};  
```

---

## How to cusomize a table cell

##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {

        var pdfDoc = new jsPDF('p', 'pt', 'a4');

		var customizeCell = function(pdfCell, gridCell) {
			if (gridCell.rowType === 'data' && gridCell.data.ID === 3) {
                pdfCell.styles.fillColor = [ 128, 255, 128];
            }
		};

        exportDataGrid(pdfDoc, e.component, customizeCell)
			.then(function () {
				pdfDoc.save("filePDF.pdf");
			});

        e.cancel = true;
    } 
};  
```

---

## How to change cell contents

##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {

        var pdfDoc = new jsPDF('p', 'pt', 'a4');

		var customizeCell = function(pdfCell, gridCell) {
			if (gridCell.column.dataField === 'Picture') {
                if (gridCell.rowType === 'data') {
                    pdfCell.content = "";
                    pdfCell.customDrawCell = function (data) {
                        var svg = '<svg height="14" width="14">\n' +
                                '  <circle cx="7" cy="7" r="4" stroke="blue" stroke-width="1" fill="red" />\n' +
                                '  Sorry, your browser does not support inline SVG.  \n' +
                                '</svg>';

                        var currentPos = data.cell.getTextPos();
                        addSvgAsImage(pdfDoc, svg, currentPos.x, currentPos.y, 14, 14);
                        pdfDoc.text("svg", currentPos.x + 14, currentPos.y, { baseline: 'top' });
                    };
                }
            }
		};

        exportDataGrid(pdfDoc, e.component, customizeCell)
			.then(function () {
				pdfDoc.save("filePDF.pdf");
			});

        e.cancel = true;
    } 
};  
```

---
