# DevExtreme_DataGridToPDF

---

#### Requirements

[jsPDF](https://github.com/MrRio/jsPDF)

[jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

---

#### Export module

[exportDxDataGrid.js](https://github.com/KuznetsovVN/DevExtreme_DataGridToPDF/blob/master/js/exporter/exportDxDataGrid.js)

---

## DataGrid Export to PDF

[Simple](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_simple.html)
[Grouping](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_grouping.html)
[Summary](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_summary.html)
[Bands](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_bands.html)

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

## Cell cusomization

[Cell cusomization example](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_custom_cell.html)

##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {
        var pdfDoc = new jsPDF('p', 'pt', 'a4');
        exportDataGrid(pdfDoc, e.component, function (pdfCell, gridCell) {
            if (gridCell.rowType === 'data' && gridCell.data.ID === 3) {
                pdfCell.styles.fillColor = [ 128, 255, 128];
            }
        }).then(function () {
            pdfDoc.save("filePDF.pdf");
        });

        e.cancel = true;
    } 
};  
```

---

## Cell template cusomization

[Custom cell cusomization example](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_custom_cell_template.html)

##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {
        var pdfDoc = new jsPDF('p', 'pt', 'a4');
        exportDataGrid(pdfDoc, e.component, function (pdfCell, gridCell) {
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
            pdfDoc.save("filePDF.pdf");
        });

        e.cancel = true;
    } 
};  
```

---

## Add Header and Footer

[Custom cell cusomization example](https://kuznetsovvn.github.io/DevExtreme_DataGridToPDF/demos/dxDataGrid/jsPDF_header_footer.html)

##### codesnippet
```javascript
let dataGridOptions = {
    onExporting: e => {
        var pdfDoc = new jsPDF('p', 'pt', 'a4');
        exportDataGrid(pdfDoc, e.component, function (pdfCell, gridCell) {
            // cusomize cell

        }).then(function () {
            // advanced pdfDoc customization

            pdfDoc.setFontSize(12);
            const pageCount = pdfDoc.internal.getNumberOfPages();
            for (var i = 1; i <= pageCount; i++) {
                var odd = (i % 2) > 0;

                pdfDoc.setPage(i);
                var pageSize = pdfDoc.internal.pageSize;
                var pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

                var header = "Export DatGrid to PDF";
                var footer = 'Page ' + String(i) + ' of ' + String(pageCount);

                // Header
                pdfDoc.text(header, 15, 5, { baseline: 'top' });

                // Footer
                if (odd)
                    pdfDoc.text(footer, pageWidth - (pdfDoc.getTextWidth(footer) + 15), pageHeight - 12, { baseline: 'top' });
                else
                    pdfDoc.text(footer, 15, pageHeight - 12, { baseline: 'top' });
            }
        }).then(function () {
            pdfDoc.save("filePDF.pdf");
        });

        e.cancel = true;
    } 
};  
```

---
