var exportDataGrid = (function () {

    /*
        customizeCell                   - Type callback   |   function(pdfCell, gridCell)
        autoTableOptions: {
            theme                       - Type: String
            useDxTheme                  - Type: Boolean
            styles                      - Type: StyleDef
            headStyles                  - Type: StyleDef
            bodyStyles                  - Type: StyleDef
            footStyles                  - Type: StyleDef
            groupStyles                 - Type: StyleDef
            groupFooterStyles           - Type: StyleDef
            totalFooterStyles           - Type: StyleDef
            ...
        }
     */

    function exportToPDF(pdfDoc, component, customizeCell, autoTableOptions) {
        const defaultAutoTableOptions = {
            startY: 15
        };

        autoTableOptions = $.extend({}, defaultAutoTableOptions, autoTableOptions);

        if (!autoTableOptions.theme) {
            autoTableOptions = $.extend({}, getDxThemeOptions(), autoTableOptions);

            // BUG in an AutoTable
            autoTableOptions.startY = 14.2;
        }

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
                        const rowType = cell.rowType;

                        var pdfCell = {
                            content: cellData.value,
                            customDrawCell: null,
                            styles: {}
                        };
                        var internalDrawCell = null;
                        var customDrawCell = null;

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
                                internalDrawCell = {
                                    func: patchBordersForGroupAndFooterCells,
                                    opts: {}
                                };
                            }
                        }

                        // Customize cell

                        if (customizeCell) {
                            customizeCell(pdfCell, cell);
                            if (pdfCell.customDrawCell) {
                                customDrawCell = {
                                    func: pdfCell.customDrawCell,
                                    opts: {}
                                };
                            }
                            delete pdfCell.customDrawCell;
                        }

                        // DevExtreme styles processing

                        if (autoTableOptions.useDxTheme) {
                            internalPrepareCell(
                                pdfCell,
                                cell,
                                rowIndex,
                                cellIndex,
                                columns.length,
                                autoTableOptions
                            );

                            internalDrawCell = {
                                func: drawDxThemeCell,
                                opts: { pdfCell: pdfCell }
                            };
                        }

                       // Assing style from dxDataGrid

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
                                if (style.wrapText) {
                                    pdfCell.styles.cellWidth = 'wrap';
                                }
                                if (style.dataType === 'date') {
                                    pdfCell.content = DevExpress.localization.formatDate(new Date(pdfCell.content), style.format);
                                }
                            }
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
                        customDrawCells.push(customDrawCell);
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

                        if (data.row.index === -1 || data.column.index === -1)
                            return;

                        // Internal draw cell
                        var internalDrawSectionMatrix = internalDrawMatrix[data.row.section];
                        var internalDrawCell = internalDrawSectionMatrix[data.row.index][data.column.index];
                        if (internalDrawCell)
                            internalDrawCell.func(data, internalDrawCell.opts);

                        // Custom draw cell

                        var customDrawSectionMatrix = customDrawMatrix[data.row.section];
                        var customDrawCell = customDrawSectionMatrix[data.row.index][data.column.index];
                        if (customDrawCell)
                            customDrawCell.func(data, customDrawCell.opts);
                    }
                },
                autoTableOptions);

            pdfDoc.autoTable(pdfDocOptions);
        });
    }

    function getDxThemeOptions() {

        var groupCellTextColorFunc = function (pdfCell, gridCell, rowIndex, cellIndex, rowLength) {
            if(cellIndex === 0)
                return 149;
            return 51;
        };

        var groupCellLineWidthsFunc = function (pdfCell, gridCell, rowIndex, cellIndex, rowLength) {
            var isFirstCell = cellIndex === 0;
            var isLastCell = cellIndex === rowLength - 1;

            var leftLineWidth = isFirstCell ? 0.1 : 0;
            var topLineWidth = 0.1;
            var rightLineWidth = isLastCell ? 0.1 : 0;
            var bottomLineWidth = 0.1;

            return [leftLineWidth, topLineWidth, rightLineWidth, bottomLineWidth];
        };

        return {
            theme: 'plain',
            useDxTheme: true,
            tableLineWidth: 0.1,
            styles: {
                textColor: 51,
                lineColor: 149,
                lineWidth: 0
            },
            headStyles: {
                fontStyle: 'normal',
                textColor: 149,
                lineWidth: 0.1
            },
            bodyStyles: {
                lineWidths: [0.1, 0]
            },
            footStyles: {
                lineWidth: 0.1
            },
            groupStyles: {
                fillColor: 247,
                getTextColor: groupCellTextColorFunc,
                getLineWidths: groupCellLineWidthsFunc
            },
            groupFooterStyles: {
                textColor: 51,
                getLineWidths: groupCellLineWidthsFunc
            },
            totalFooterStyles: {
                textColor: 51,
                minCellHeight: 11,
                valign: 'middle',
                getLineWidths: groupCellLineWidthsFunc
            }
        };
    }

    function internalPrepareCell(pdfCell, gridCell, rowIndex, cellIndex, rowLength, options) {
        var rowType = gridCell.rowType;

        if (rowType === 'header')
            rowType = 'head';

        if (rowType === 'data')
            rowType = 'body';

        if (rowType === 'footer')
            rowType = 'foot';

        pdfCell.styles = $.extend({}, options.styles, options[rowType + 'Styles'], pdfCell.styles);

        // try extend dynamic styles

        var funcs = Object.getOwnPropertyNames(pdfCell.styles).filter(function (p) {
            return typeof pdfCell.styles[p] === 'function';
        });

        for (var i = 0; i < funcs.length; i++) {
            var funcName = funcs[i];
            if (funcName.startsWith("get")) {
                var propName = funcName.substring(3);
                propName = propName.charAt(0).toLowerCase() + propName.slice(1);
                pdfCell.styles[propName] = pdfCell.styles[funcName](pdfCell, gridCell, rowIndex, cellIndex, rowLength);
            }
        }

        // remove common if has specific

        var lineColors = pdfCell.styles.lineColors;
        var lineWidths = pdfCell.styles.lineWidths;

        if (lineColors && Array.isArray(lineColors)) {
            if (pdfCell.styles.hasOwnProperty('lineColor'))
                delete pdfCell.styles['lineColor'];
        }

        if (lineWidths && Array.isArray(lineWidths)) {
            if (pdfCell.styles.hasOwnProperty('lineWidth'))
                delete pdfCell.styles['lineWidth'];
        }
    }

    function drawDxThemeCell(hookData, opts) {
        var pdfCell = opts.pdfCell;

        // if own styles: lineWidths

        var doc = hookData.doc;
        var cell = hookData.cell;

        var prevLineColor = doc.getDrawColor();

        var lineWidths = pdfCell.styles.lineWidths;
        var lineColors = pdfCell.styles.lineColors || [pdfCell.styles.lineColor];

        if (lineWidths && Array.isArray(lineWidths)) {
            var widths = toRect(lineWidths);
            var colors = toRect(lineColors);

            // left border
            if (widths.left > 0) {
                if (colors.left)
                    setDrawColor(doc, colors.left);
                doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
            }

            // top border
            if (widths.top > 0) {
                if (colors.top)
                    setDrawColor(doc, colors.top);
                doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
            }

            // right border
            if (widths.right > 0) {
                if (colors.right)
                    setDrawColor(doc, colors.right);
                doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
            }

            // bottom border
            if (widths.bottom > 0) {
                if (colors.buttom)
                    setDrawColor(doc, colors.buttom);
                doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
            }

            setDrawColor(doc, prevLineColor);
        }
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

                setDrawColor(doc, fillColor);
                setFillColor(doc, fillColor);
                doc.rect(cursor.x - 0.3, cursor.y + lineWidth, 0.6, cell.height - lineWidth * 2, "FD");

                setDrawColor(doc, lineColor);
                doc.line(cursor.x - 0.3, cursor.y, cursor.x + 0.3, cursor.y);
                doc.line(cursor.x - 0.3, cursor.y + cell.height, cursor.x + 0.3, cursor.y + cell.height);

                setDrawColor(doc, prevLineColor);
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

    function tryGetPropNameFunc(stylesObj, propName, pdfCell, gridCell, rowIndex, cellIndex, rowLength) {
        var funcName = 'get' + propName.charAt(0).toUpperCase() + propName.substring(1);
        if (stylesObj[funcName] && typeof stylesObj[funcName] === 'function')
            return stylesObj[funcName](pdfCell, gridCell, rowIndex, cellIndex, rowLength);
        return undefined;
    }

    // Utility

    function toRect(value) {
        if (Array.isArray(value)) {
            if (value.length === 1)
                return { left: value[0], top: value[0], right: value[0], bottom: value[0] };

            if (value.length === 2) {
                return { left: value[0], top: value[1], right: value[0], bottom: value[1] };
            }

            if (value.length === 3) {
                return { left: value[0], top: value[1], right: value[2], bottom: value[1] };
            }

            if (value.length === 4) {
                return { left: value[0], top: value[1], right: value[2], bottom: value[3] };
            }
        }
        else
            return { left: value, top: value, right: value, bottom: value };
    }

    function setDrawColor(doc, color) {
        if (Array.isArray(color))
            doc.setDrawColor(color[0], color[1], color[2]);
        else
            doc.setDrawColor(color);
    }

    function setFillColor(doc, color) {
        if (Array.isArray(color))
            doc.setFillColor(color[0], color[1], color[2]);
        else
            doc.setFillColor(color);
    }

    function setTextColor(doc, color) {
        if (Array.isArray(color))
            doc.setTextColor(color[0], color[1], color[2]);
        else
            doc.setTextColor(color);
    }

    return exportToPDF;

})(jQuery);
