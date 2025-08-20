import ExcelJS from 'exceljs';

async function generateExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  sheet.addRow(['Name', 'Value']);
  data.forEach(item => {
    sheet.addRow([item.name, item.value]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export default { generateExcel };
