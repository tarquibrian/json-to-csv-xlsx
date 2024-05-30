const fs = require("fs");
const XLSX = require('xlsx')
const { parse } = require("json2csv");

const jsonData1 = fs.readFileSync("datos.json", "utf-8");
const data = JSON.parse(jsonData1);

function compareDate(objA, objB) {
  const dateA = new Date(objA.timestamp_monitores);
  const dateB = new Date(objB.timestamp_monitores);
  return dateA - dateB;
}

function timestampToFormattedDate(timestamp) {
  const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function transformarMonitores(objeto) {
  const result = { ...objeto };
  if (
    objeto.monitores &&
    Array.isArray(objeto.monitores) &&
    objeto.monitores.length > 0
  ) {
    objeto.monitores.forEach((monitor, indice) => {
      if (monitor.timestamp) {
        monitor.timestamp = timestampToFormattedDate(monitor.timestamp);
      }
      Object.keys(monitor).forEach((clave) => {
        const nuevoNombre = `${clave}_monitores`;

        result[nuevoNombre] = monitor[clave];
      });
    });
    delete result.monitores;
  }
  return result;
}

const transformedData = data.map(transformarMonitores);
const ordererData = transformedData.sort(compareDate)


const fechaMasReciente = new Date(ordererData[ordererData.length - 1].timestamp_monitores);

const objetosUltimoMes = ordererData.filter(objeto => {
  const fechaObjeto = new Date(objeto.timestamp_monitores);
  return (
    fechaObjeto.getMonth() === fechaMasReciente.getMonth() &&
    fechaObjeto.getFullYear() === fechaMasReciente.getFullYear()
  )
});

function createFiles(data, name) {
  try {
    const dataParse = parse(data)
    const dataXLSX = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataXLSX, 'Datos')
    XLSX.writeFile(workbook, `output/xlsx/${name}.xlsx`)
    fs.writeFileSync(`output/csv/${name}.csv`, dataParse, "utf-8");
    fs.writeFileSync(`output/json/${name}.json`, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.log('ERROR', error)
  }
}

createFiles(ordererData, 'datos-totales')
createFiles(objetosUltimoMes, 'datos-ultimo-mes')
