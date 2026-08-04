import { PDFDocument } from 'pdf-lib';
async function test() {
  const doc = await PDFDocument.create();
  const obj = doc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFA1',
    Alternate: 'DeviceRGB'
  });
  console.log(obj.toString());
}
test();
