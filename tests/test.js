import $ from '../libs/jquery';

import jsPDF from '../libs/jspdf.debug';
import jsPDFAutotable from '../libs/jspdf.plugin.autotable';

import exportPDF from '../js/Exporter/exportDxDataGrid';

QUnit.testStart(() => {
    const markup = '<div id=\'dataGrid\'></div>';

    $('#qunit-fixture').html(markup);
});

QUnit.test("a simple test", function (assert) {
    var pdfDoc = new jsPDF('p', 'pt', 'a4');
    exportPDF(pdfDoc, {}, function (pdfCell, gridCell) {
    }).then(function () {

        var table = pdfDoc.lastAutoTable;
        assert.deepEqual(table.head.length, 4, 'dataGrid columns count');
        assert.deepEqual(table.body.length, 16, 'dataGrid rows count');

    });
});
