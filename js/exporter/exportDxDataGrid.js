var exportDataGrid = (function () {

    function exportToPDF(pdfDoc, component, customizeCell, autoTableOptions) {
        const defaultAutoTableOptions = {
            theme: 'plain',
            startY: 15
        };
        autoTableOptions = $.extend({}, defaultAutoTableOptions, autoTableOptions);

        const dataProvider = component.getDataProvider(component.getController("export")._selectionOnly);

        var rowMatrix = [];
        var headerMatrix = [];

        var internalDrawMatrix = {
            head: [],
            body: [],
            foot: []
        };

        var customDrawMatrix = {
            head: [],
            body: [],
            foot: []
        };

        var columnStyles = [];

        return new Promise((resolve) => {
            dataProvider.ready().done(() => {
                const columns = dataProvider.getColumns();
                const headerRowCount = dataProvider.getHeaderRowCount();
                const dataRowsCount = dataProvider.getRowsCount();

                const mergedCells = [];
                const mergeRanges = [];

                for (let i = 0; i < columns.length; i++) {
                    columnStyles[i] = columnStyles[i] || {};
                    columnStyles[i].cellWidth = 'auto';
                }

                const styles = dataProvider.getStyles();

                for (let rowIndex = 0; rowIndex < dataRowsCount; rowIndex++) {
                    var headerRow = [];
                    var row = [];
                    var internalDrawCells = [];
                    var customDrawCells = [];

                    for (let cellIndex = 0; cellIndex < columns.length; cellIndex++) {
                        const cellData = dataProvider.getCellData(rowIndex, cellIndex, true);
                        const cell = cellData.cellSourceData;
                        const rowType = cellData.cellSourceData.rowType;

                        var pdfCell = {
                            content: cellData.value,
                            customDrawCell: null,
                            styles: {}
                        };
                        var internalDrawCell = null;

                        // Get rowSpan & colSpan in header

                        if (rowType === 'header') {
                            var mergedRange = tryGetMergeRange(rowIndex, cellIndex, mergedCells, dataProvider);
                            if (mergedRange && mergedRange.rowSpan > 0) {
                                pdfCell.rowSpan = mergedRange.rowSpan + 1;
                            }
                            if (mergedRange && mergedRange.colSpan > 0) {
                                pdfCell.colSpan = mergedRange.colSpan + 1;
                            }
                        }

                        // ColSpans processing for rows

                        if (rowType === 'group' || rowType === 'groupFooter' || rowType === 'totalFooter') {
                            pdfCell.content = pdfCell.content || '';

                            if (rowType === 'group') {
                                if (pdfCell.content === "" && row.length === 1) {
                                    var last = row[row.length - 1];
                                    if (last) {
                                        last.colSpan = last.colSpan || 1;
                                        last.colSpan += 1;
                                    }
                                }
                            }

                            internalDrawCell = function (data) {
                                var noTheme = data.settings.theme === 'plain';
                                if (!noTheme) {
                                    var lineWidth = data.cell.styles.lineWidth;
                                    if (lineWidth > 0) {
                                        var isFirst = data.column.index === 0;
                                        if (!isFirst) {

                                            var fillColor = data.cell.styles.fillColor;
                                            var lineColor = data.cell.styles.lineColor;

                                            var x = data.cursor.x;
                                            var y = data.cursor.y;
                                            var w = data.cell.width;
                                            var h = data.cell.height;

                                            data.doc.setDrawColor(fillColor);
                                            data.doc.setFillColor(fillColor);
                                            data.doc.rect(x - 0.3, y + lineWidth, 0.6, h - lineWidth * 2, "FD");

                                            data.doc.setDrawColor(lineColor);
                                            data.doc.line(x - 0.3, y, x + 0.3, y);
                                            data.doc.line(x - 0.3, y + h, x + 0.3, y + h);
                                        }
                                    }
                                }
                            };
                        }

                        // Assing style from dxDataGrid

                        //styles
                        var style = styles[dataProvider.getStyleId(rowIndex, cellIndex)];
                        if (style) {
                            //debugger;
                            if (style.alignment)
                                pdfCell.styles.halign = style.alignment;
                            if (style.bold)
                                pdfCell.styles.fontStyle = 'bold';
                            if (style.format) {
                                // 
                            }
                            if (style.wrapText) {
                                pdfCell.styles.cellWidth = 'wrap';
                            }
                            if (style.dataType) {
                                // 
                            }
                        }

                        // Customize cell

                        if (customizeCell !== undefined) {
                            customizeCell(pdfCell, cell);
                        }

                        // Add cell to row

                        if (rowType === 'header') {
                            if (pdfCell.content !== "")
                                headerRow.push(pdfCell);
                        }
                        else {
                            if (rowType === 'group') {
                                if (pdfCell.content !== "")
                                    row.push(pdfCell);
                            }
                            else {
                                row.push(pdfCell);
                            }
                        }

                        internalDrawCells.push(internalDrawCell);
                        customDrawCells.push(pdfCell.customDrawCell);
                        delete pdfCell.customDrawCell;
                    }

                    // Custom draw cell hooks

                    if (headerRow.length > 0) {
                        headerMatrix.push(headerRow);
                        internalDrawMatrix['head'].push(internalDrawCells);
                        customDrawMatrix['head'].push(customDrawCells);
                    }
                    if (row.length > 0) {
                        rowMatrix.push(row);
                        internalDrawMatrix['body'].push(internalDrawCells);
                        customDrawMatrix['body'].push(customDrawCells);
                    }
                }

                resolve();
            });
        }).then(function () {
            var pdfDocOptions = $.extend({},
                {
                    head: headerMatrix,
                    body: rowMatrix,
                    columnStyles: columnStyles,
                    didDrawCell: function (data) {

                        // Internal draw cell

                        var internalMatrix = internalDrawMatrix[data.row.section];
                        var internalDrawFunc = internalMatrix[data.row.index][data.column.index];
                        if (internalDrawFunc)
                            internalDrawFunc(data);

                        // Custom draw cell

                        var customMatrix = customDrawMatrix[data.row.section];
                        var customDrawFunc = customMatrix[data.row.index][data.column.index];
                        if (customDrawFunc)
                            customDrawFunc(data);
                    }
                },
                autoTableOptions);

            pdfDoc.autoTable(pdfDocOptions);
        });
    }

    function tryGetMergeRange(rowIndex, cellIndex, mergedCells, dataProvider) {
        if (!mergedCells[rowIndex] || !mergedCells[rowIndex][cellIndex]) {
            const cellMerge = dataProvider.getCellMerging(rowIndex, cellIndex);
            if (cellMerge.colspan || cellMerge.rowspan) {
                for (let i = rowIndex; i <= rowIndex + cellMerge.rowspan || 0; i++) {
                    for (let j = cellIndex; j <= cellIndex + cellMerge.colspan || 0; j++) {
                        if (!mergedCells[i]) {
                            mergedCells[i] = [];
                        }
                        mergedCells[i][j] = true;
                    }
                }
                return { rowSpan: cellMerge.rowspan, colSpan: cellMerge.colspan };
            }
        }
    }

    return exportToPDF;

})(jQuery);
