# DevExtreme_DataGridToPDF

---

#### Requirements

[jsPDF](https://github.com/MrRio/jsPDF)

[jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

---

#### Export module

[exportDxDataGrid.js](https://github.com/KuznetsovVN/DevExtreme_DataGridToPDF/blob/master/js/Exporter/exportDxDataGrid.js)

---

#### Grouping

[example](https://github.com/KuznetsovVN/DevExtreme_DataGridToPDF/blob/master/demos/dxDataGrid/jsPDF_grouping.html) || [live](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_grouping.html)
##### screenshot
![GitHub Logo](https://i.gyazo.com/b1fe637d5cbf2f711bb96de2acc5ef53.png)
##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {
        var pdfDoc = new jsPDF();
        exportDataGrid(pdfDoc, e.component, function (pdfCell, gridCell) {
            // cusomize cell
        }).then(function () {
            // advanced pdfDoc customization
        }).then(function () {
            pdfDoc.save("filePDF.pdf");
        });

        e.cancel = true;
    } 
};  
```

---

#### Summary

[example](https://github.com/KuznetsovVN/DevExtreme_DataGridToPDF/blob/master/demos/dxDataGrid/jsPDF_summary.html) || [live](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_summary.html)
##### screenshot
![GitHub Logo](https://i.gyazo.com/21a71e2af3733528d0b11f9ea601fbb4.png)
##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {
        var pdfDoc = new jsPDF();
        var autoTableConfig = {
            tableLineWidth: 0.3
        };
        exportDataGrid(pdfDoc, e.component, function (pdfCell, gridCell) {
            // cusomize cell
            pdfCell.styles.lineWidth = 0.3;

            if (gridCell.rowType === 'data' && gridCell.column.dataField === 'OrderDate') {
                pdfCell.content = Globalize.formatDate(gridCell.value, { date: "short" })
            }
        }, autoTableConfig).then(function () {
            // advanced pdfDoc customization
        }).then(function () {
            pdfDoc.save("filePDF.pdf");
        });

        e.cancel = true;
    } 
};  
```

---

#### Cell cusomization

[example](https://github.com/KuznetsovVN/DevExtreme_DataGridToPDF/blob/master/demos/dxDataGrid/jsPDF_bands.html) || [live](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_bands.html)
##### screenshot
![GitHub Logo](https://i.gyazo.com/47a58750d1d067e89b50de343615466d.png)
##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {
        var pdfDoc = new jsPDF();
        exportDataGrid(pdfDoc, e.component, function (pdfCell, gridCell) {
            // cusomize cell
            pdfCell.styles.lineWidth = 1;
            if (gridCell.rowType === 'data') {
                pdfCell.styles.fillColor = [255, 87, 51];
                pdfCell.styles.textColor = [0, 0, 255];
            }
        }).then(function () {
            // advanced pdfDoc customization
        }).then(function () {
            pdfDoc.save("filePDF.pdf");
        });

        e.cancel = true;
    } 
};  
```

---

#### Cell template cusomization

[example](https://github.com/KuznetsovVN/DevExtreme_DataGridToPDF/blob/master/demos/dxDataGrid/jsPDF_custom_cell.html) || [live](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_custom_cell.html)
##### screenshot
![GitHub Logo](https://i.gyazo.com/733bca3d142855c14d85c7ea7559fe6c.png)
##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {
        var pdfDoc = new jsPDF('p', 'pt', 'a4');
        exportDataGrid(pdfDoc, e.component, function (pdfCell, gridCell) {
            // cusomize cell
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

        }).then(function () {
            // advanced pdfDoc customization
        }).then(function () {
            pdfDoc.save("filePDF.pdf");
        });

        e.cancel = true;
    } 
};  
```
