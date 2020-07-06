var exportDataGrid = (function () {

    function exportToPDF(pdfDoc, component, customizeCell, autoTableOptions) {
        const defaultAutoTableOptions = {
            startY: 10
        };
        autoTableOptions = autoTableOptions || defaultAutoTableOptions;

        const dataProvider = component.getDataProvider(component.getController("export")._selectionOnly);

        var matrix = [];
        var headerMatrix = [];
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

                for (let rowIndex = 0; rowIndex < dataRowsCount; rowIndex++) {
                    var row = [];
                    var headerRow = [];
                    const styles = dataProvider.getStyles();

                    for (let cellIndex = 0; cellIndex < columns.length; cellIndex++) {
                        const cellData = dataProvider.getCellData(rowIndex, cellIndex, true);
                        const cell = cellData.cellSourceData;

                        var pdfCell = { content: cellData.value, styles: {} };


                        // Customize cell Event
                        if (customizeCell !== undefined) {
                            customizeCell(pdfCell, cell);
                        }

                        // Get rowSpan & colSpan in header
                        if (rowIndex < headerRowCount) {
                            var mergedRange = tryGetMergeRange(rowIndex, cellIndex, mergedCells, dataProvider);
                            if (mergedRange && mergedRange.rowSpan > 0) {
                                pdfCell.rowSpan = mergedRange.rowSpan + 1;
                            }
                            if (mergedRange && mergedRange.colSpan > 0) {
                                pdfCell.colSpan = mergedRange.colSpan + 1;
                            }
                        }

                        // Add header/body row
                        if (cellData.cellSourceData.rowType === 'header' && pdfCell.content !== "") {
                            headerRow.push(pdfCell);
                        } else {
                            if (cellData.cellSourceData.rowType === 'group') {
                                pdfCell.colSpan = columns.length;
                            }
                            row.push(pdfCell);
                        }
                    }

                    if (rowIndex >= headerRowCount) {
                        matrix.push(row);
                    } else {
                        headerMatrix.push(headerRow);
                    }
                }

                resolve();
            });
        }).then(function () {
            var pdfDocOptions = $.extend({},
                {
                    head: headerMatrix,
                    body: matrix,
                    columnStyles: columnStyles
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
