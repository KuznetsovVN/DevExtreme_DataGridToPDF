var exportDataGrid = (function () {

    function exportToPDF(pdfDoc, component, customizeCell, autoTableOptions) {
        const defaultAutoTableOptions = {
            startY: 15
        };

        autoTableOptions = $.extend({}, defaultAutoTableOptions, autoTableOptions);

        if (!autoTableOptions.theme) {
            autoTableOptions = $.extend({}, autoTableOptions, getDxThemeStyles());
        }

        const dataProvider = component.getDataProvider(component.getController("export")._selectionOnly);

        var rowMatrix = [];
        var headerMatrix = [];

        var internalEndDrawPage;

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
                        const rowType = cell.rowType;

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

                            if (autoTableOptions.theme === 'grid') {
                                internalDrawCell = function (data) {
                                    patchBordersForGroupAndFooterCells(data);
                                };
                            }
                        }

                        // Assing style from dxDataGrid

                        if (autoTableOptions.useDxTheme) {
                            customizeDxThemeCell(
                                pdfCell,
                                cell,
                                {
                                    cellIndex: cellIndex,
                                    rowLength: columns.length,
                                    dxThemeConfig: getDxThemeConfig()
                                }
                            );

                            internalDrawCell = function (data) {
                                drawDxThemeCell(data, {
                                    gridCell: cell,
                                    dxThemeConfig: getDxThemeConfig()
                                });
                            };

                            internalEndDrawPage = function (data) {
                                endPageDxThemeCell(data, {
                                    dxThemeConfig: getDxThemeConfig()
                                });
                            };
                        }

                        //styles
                        if (rowType === 'header') {
                            if (columns[cellIndex].alignment)
                                pdfCell.styles.halign = columns[cellIndex].alignment;
                        }
                        else {
                            var style = styles[dataProvider.getStyleId(rowIndex, cellIndex)];
                            if (style) {
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
                                if (pdfCell.content !== "" || row.length > 1)
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
                    },
                    didDrawPage: internalEndDrawPage
                },
                autoTableOptions);

            pdfDoc.autoTable(pdfDocOptions);
        });
    }

    function getDxThemeConfig() {
        return {

            styles: {
                textColor: 51,
                lineColor: 149,
                lineWidth: 0.1
            },
            headCellStyles: {
                fontStyle: 'normal',
                textColor: 149,
                minCellHeight: 8,
                valign: 'bottom'
            },
            bodyCellStyles: {},
            footCellStyles: {},
            groupCellStyles: {},
            groupFooterCellStyles: {},
            totalFooterCellStyles: {
                minCellHeight: 11,
                valign: 'middle'
            },
            getTextColor: function (gridCell, cellIndex, rowLength) {
                if (gridCell.rowType === 'group') {
                    if (cellIndex === 0)
                        return 149;
                }
                return undefined;
            },
            getFillColor: function (gridCell, cellIndex, rowLength, borderSide) {
                if (gridCell.rowType === 'group')
                    return 247;
                return undefined;
            },
            getLineColor: function (gridCell, cellIndex, rowLength,  borderSide) {
                return this.styles.lineColor;
            },
            getLineWidth: function (gridCell, cellIndex, rowLength, borderSide) {
                if (['data', 'group', 'groupFooter', 'totalFooter'].some(t => t === gridCell.rowType)) {
                    //var isFirst = cellIndex === 0;
                    //var isLast = cellIndex === rowLength - 1;

                    //if (borderSide === 'left' || borderSide === 'right') {
                    //    return 0;
                    //}
                    return 0;
                }

                return undefined;
            }
        };
    }

    function getDxThemeStyles() {
        var config = getDxThemeConfig();
        return {
            theme: 'plain',
            useDxTheme: true,
            styles: $.extend({}, config.styles),
            headStyles: $.extend({}, config.headCellStyles),
            bodyStyles: $.extend({}, config.bodyCellStyles),
            footStyles: $.extend({}, config.footCellStyles)
        };
    }

    function customizeDxThemeCell(pdfCell, gridCell, options) {
        var config = options.dxThemeConfig;

        var configStyles = {
            group: config.groupCellStyles,
            groupFooter: config.groupFooterCellStyles,
            totalFooter: config.totalFooterCellStyles
        };

        if (configStyles[gridCell.rowType])
            pdfCell.styles = $.extend({}, pdfCell.styles, configStyles[gridCell.rowType]);


        var dynamicStyles = {
            textColor: config.getTextColor(gridCell, options.cellIndex, options.rowLength),
            fillColor: config.getFillColor(gridCell, options.cellIndex, options.rowLength),
            lineWidth: config.getLineWidth(gridCell, options.cellIndex, options.rowLength)
        };

        if (dynamicStyles.textColor !== undefined)
            pdfCell.styles.textColor = dynamicStyles.textColor;

        if (dynamicStyles.fillColor !== undefined)
            pdfCell.styles.fillColor = dynamicStyles.fillColor;

        if (dynamicStyles.lineWidth !== undefined)
            pdfCell.styles.lineWidth = dynamicStyles.lineWidth;
    }

    function drawDxThemeCell(hookData, options) {
        if (['data', 'group', 'groupFooter', 'totalFooter'].some(t => t === options.gridCell.rowType)) {
            var doc = hookData.doc;
            var cell = hookData.cell;

            var prevLineColor = doc.getDrawColor();
            var lineColor = options.dxThemeConfig.getLineColor(options.gridCell, hookData.column.index, hookData.row.raw.length);
            doc.setDrawColor(lineColor);

            if (options.gridCell.rowType === 'data') {
                // left border
                doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);

                // right border
                doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
            }
            else {
                var isFirstCell = hookData.cell.raw === hookData.row.raw[0];
                var isLastCell = hookData.cell.raw === hookData.row.raw[hookData.row.raw.length - 1];

                // left border
                if (isFirstCell)
                    doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);

                // right border
                if (isLastCell)
                    doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);

                // top border
                doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);

                // bottom border
                doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
            }

            doc.setDrawColor(prevLineColor);
        }
    }

    function endPageDxThemeCell(hookData, options) {
        var doc = hookData.doc;
        var margin = hookData.settings.margin;
        var pageSize = doc.internal.pageSize;
        var pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

        doc.line(margin.left, hookData.cursor.y, pageWidth - margin.right, hookData.cursor.y);
    }

    function patchBordersForGroupAndFooterCells(hookData) {
        var lineWidth = hookData.cell.styles.lineWidth;
        if (lineWidth > 0) {
            var doc = hookData.doc;

            var column = hookData.column;
            var cell = hookData.cell;
            var cursor = hookData.cursor;

            var fillColor = cell.styles.fillColor;
            var lineColor = cell.styles.lineColor;

            var isFirst = column.index === 0;
            if (!isFirst) {
                var prevLineColor = doc.getDrawColor();

                doc.setDrawColor(fillColor);
                doc.setFillColor(fillColor);
                doc.rect(cursor.x - 0.3, cursor.y + lineWidth, 0.6, cell.height - lineWidth * 2, "FD");

                doc.setDrawColor(lineColor);
                doc.line(cursor.x - 0.3, cursor.y, cursor.x + 0.3, cursor.y);
                doc.line(cursor.x - 0.3, cursor.y + cell.height, cursor.x + 0.3, cursor.y + cell.height);

                doc.setDrawColor(prevLineColor);
            }
        }
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
