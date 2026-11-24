'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// gstRate is supplied in percentage units, as expected by invoice.js.
// HSN is also present so pricing.js can resolve the same slab through tax.js.
function line(name, price, qty, hsn, gstRate) {
  return { name, sku: name, price, qty, hsn, gstRate };
}

function compare(order, expectedInvoice, expectedPricing) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual(invoiceFigures, expectedInvoice);
  assert.deepStrictEqual(pricingFigures, expectedPricing);
  return { invoiceFigures, pricingFigures };
}

test('CURRENT BEHAVIOUR: mixed 5% and 12% slabs without a coupon', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      line('Rice 5%', 640, 1, '1006', 5),
      line('Ghee 12%', 450, 1, '0405', 12)
    ]
  };

  compare(order, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice 5%', sku: 'Rice 5%', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee 12%', sku: 'Ghee 12%', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, {
    subtotal: 1090,
    discount: 0,
    taxable: 1090,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    lines: [
      { id: undefined, name: 'Rice 5%', hsn: '1006', gstPercent: 5, gross: 640, discount: 0, taxable: 640, tax: 32, net: 672 },
      { id: undefined, name: 'Ghee 12%', hsn: '0405', gstPercent: 12, gross: 450, discount: 0, taxable: 450, tax: 54, net: 504 }
    ]
  });
});

test('SAVE10 invoice uses checkout discount and post-discount GST on the #1002-like order', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      line('Rice 5%', 640, 1, '1006', 5),
      line('Sunflower oil 5%', 190, 2, '1512', 5)
    ]
  };

  compare(order, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { name: 'Rice 5%', sku: 'Rice 5%', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
      { name: 'Sunflower oil 5%', sku: 'Sunflower oil 5%', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020,
    discount: 102,
    taxable: 918,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    lines: [
      { id: undefined, name: 'Rice 5%', hsn: '1006', gstPercent: 5, gross: 640, discount: 64, taxable: 576, tax: 28.8, net: 604.8 },
      { id: undefined, name: 'Sunflower oil 5%', hsn: '1512', gstPercent: 5, gross: 380, discount: 38, taxable: 342, tax: 17.1, net: 359.1 }
    ]
  });
});

test('SAVE10 invoice uses the ₹150 cap on the #1004-like order', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [line('Groundnut oil 5%', 1120, 2, '1508', 5)]
  };

  compare(order, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { name: 'Groundnut oil 5%', sku: 'Groundnut oil 5%', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    taxable: 2090,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    lines: [
      { id: undefined, name: 'Groundnut oil 5%', hsn: '1508', gstPercent: 5, gross: 2240, discount: 150, taxable: 2090, tax: 104.5, net: 2194.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: all-18% #1008-like order without a coupon', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      line('Packaged tea 18%', 140, 1, '0902', 18),
      line('Sherbet concentrate 18%', 180, 2, '2106', 18)
    ]
  };

  compare(order, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { name: 'Packaged tea 18%', sku: 'Packaged tea 18%', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Sherbet concentrate 18%', sku: 'Sherbet concentrate 18%', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500,
    discount: 0,
    taxable: 500,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    lines: [
      { id: undefined, name: 'Packaged tea 18%', hsn: '0902', gstPercent: 18, gross: 140, discount: 0, taxable: 140, tax: 25.2, net: 165.2 },
      { id: undefined, name: 'Sherbet concentrate 18%', hsn: '2106', gstPercent: 18, gross: 360, discount: 0, taxable: 360, tax: 64.8, net: 424.8 }
    ]
  });
});


test('invoice matches checkout on HSN GST and capped coupon before tax', () => {
  // Mirrors saved #1004 line data, which contains HSN but no gstRate.
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      { id: 5, sku: 'OIL-002', name: 'Cold-Pressed Groundnut Oil 5L', hsn: '1508', price: 1120, qty: 2 }
    ]
  };

  const expected = {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5
  };
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total
  }, expected);
  assert.deepStrictEqual({
    subtotal: pricingFigures.subtotal,
    discount: pricingFigures.discount,
    tax: pricingFigures.tax,
    cgst: pricingFigures.cgst,
    sgst: pricingFigures.sgst,
    total: pricingFigures.total
  }, expected);
  assert.deepStrictEqual(invoiceFigures.rows, [
    {
      name: 'Cold-Pressed Groundnut Oil 5L',
      sku: 'OIL-002',
      hsn: '1508',
      qty: 2,
      price: 1120,
      gstPercent: 5,
      line: 2240,
      lineTax: 104.5
    }
  ]);
});

