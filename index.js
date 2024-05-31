const fs = require("fs");
const XLSX = require('xlsx')
const { parse } = require("json2csv");

const jsonData1 = fs.readFileSync("datos.json", "utf-8");
const data = JSON.parse(jsonData1);

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
  'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

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

function obtenerDatosMes(data, mes) {
  data.forEach(obj => {
    obj.fechaMonitoreo = new Date(obj.timestamp_monitores);
  })

  const fechasMonitoreo = data.map(obj => obj.fechaMonitoreo);
  const fechaMasReciente = new Date(Math.max(...fechasMonitoreo))

  return data.filter(obj => {
    const fechaMonitoreo = obj.fechaMonitoreo;
    const diferenciaMeses = (fechaMasReciente.getFullYear() - fechaMonitoreo.getFullYear()) * 12
      + fechaMasReciente.getMonth() - fechaMonitoreo.getMonth();
    return diferenciaMeses === mes
  })
}

function desanidarDatos(obj) {
  let riegos = obj.riegos || [];
  console.log(riegos)
  riegos.forEach((riego, index) => {
    obj[`id_riegos_${index}`] = riego.id;
    obj[`timestamp_riegos_${index}`] = timestampToFormattedDate(riego.timestamp);
  })
  // delete obj.riegos;

  return obj;
}

function createFiles(data, name) {
  try {
    if (data.length === 0) {
      console.log('Sin datos')
      return
    }
    const getDate = new Date(data[data.length - 1].timestamp_monitores);
    const labelMonthDate = meses[getDate.getMonth()]
    const labelYearDate = getDate.getFullYear()
    const dataParse = parse(data)
    const dataXLSX = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataXLSX, 'Datos')
    XLSX.writeFile(workbook, `output/xlsx/${name}-${labelMonthDate}-${labelYearDate}.xlsx`)
    fs.writeFileSync(`output/csv/${name}-${labelMonthDate}-${labelYearDate}.csv`, dataParse, "utf-8");
    // fs.writeFileSync(`output/json/${name}-${labelMonthDate}-${labelYearDate}.json`, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Output: ' + labelMonthDate + '/' + labelYearDate)
  } catch (error) {
    console.log('ERROR', error)
  }
}

const datosMes = obtenerDatosMes(ordererData, 0)
let datosDesanidados = ordererData.map(desanidarDatos)

createFiles(datosDesanidados, `datos-totales`)
