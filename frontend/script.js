const url = 'http://localhost:3000';
let previousFiles = [];

let csv_file_name = null
let separator = null
let xlsx_output = null
let excel_sheet_name = null

let last_clicked_csv_btn = null
let last_clicked_xlsx_btn = null
let last_clicked_separator_btn = null
let last_clicked_excel_sheet_btn = null

function createCSVFileInf(name) {
  const csvNameInput = document.querySelector('.csv_name_input');

  const csvFile = document.createElement('button')
  csvFile.classList.add('csv_file')
  csvFile.innerHTML = '<i class="fa-solid fa-file-csv"></i>'
  csvNameInput.append(csvFile)

  const csvFileName = document.createElement('h5')
  csvFileName.classList.add('csv_file_name')
  csvFileName.textContent = name
  csvFile.append(csvFileName)
}

function createExcelFileInf(name) {
  const excelNameInput = document.querySelector('.excel_name_output_content');

  const excelFile = document.createElement('button')
  excelFile.classList.add('xlsx_file')
  excelFile.innerHTML = '<i class="fa-solid fa-file-excel"></i>'
  excelNameInput.append(excelFile)

  const excelFileName = document.createElement('h5')
  excelFileName.classList.add('xslx_file_name')
  excelFileName.textContent = name
  excelFile.append(excelFileName)
}

document.querySelector('.excel_name_output_content').addEventListener('click', e => {
  if (e.target.classList.contains('xlsx_file')) {
    xlsx_output = null
    document.querySelector('.excel_sheet_input_content').innerHTML = ''
    
    if (last_clicked_xlsx_btn != null)
      last_clicked_xlsx_btn.classList.remove('a')

    last_clicked_xlsx_btn = e.target
    e.target.classList.add('a')

    xlsx_output = e.target.textContent
    getExcelSheets(xlsx_output)
  }
})

document.querySelector('.example_separators').addEventListener('click', e => {  
  if (e.target.classList.contains('separator')) {
    separator = null

    if (last_clicked_separator_btn != null)
      last_clicked_separator_btn.classList.remove('a')

    last_clicked_separator_btn = e.target
    e.target.classList.add('a')
    separator = e.target.textContent
  }
})

document.querySelector('.csv_name_input_container').addEventListener('click', e => {  
  if (e.target.classList.contains('csv_file')) {
    csv_file_name = null

    if (last_clicked_csv_btn != null)
      last_clicked_csv_btn.classList.remove('a')

    last_clicked_csv_btn = e.target
    e.target.classList.add('a')
    csv_file_name = e.target.textContent
  }
})

document.querySelector('.excel_sheet_input_content').addEventListener('click', e => {  
  if (e.target.classList.contains('excel_sheet')) {
    excel_sheet_name = null

    if (last_clicked_excel_sheet_btn != null)
      last_clicked_excel_sheet_btn.classList.remove('a')

    last_clicked_excel_sheet_btn = e.target
    e.target.classList.add('a')
    excel_sheet_name = e.target.textContent
  }
})

async function fetchFiles() {
  try {
    const response = await fetch(`${url}/files`);
    if (!response.ok) {
      throw new Error(`Ошибка: ${response.status}`);
    }
    const data = await response.json();

    const newFiles = data.files;

    if (JSON.stringify(newFiles) !== JSON.stringify(previousFiles)) {
      document.querySelector('.csv_name_input').innerHTML = '';
      document.querySelector('.excel_name_output_content').innerHTML = '';
      
      newFiles.forEach(file => {
        if (file.includes('.csv')) {
          createCSVFileInf(file);
        } else if (file.includes('.xlsx')) {
          createExcelFileInf(file) 
        }
      });
      previousFiles = newFiles;
    }
  } catch (error) {
    document.querySelector('.csv_name_input').innerHTML = `<div class="exception_inf"><h4>${error.message}</h4></div>`;
    document.querySelector('.excel_name_output_content').innerHTML = `<div class="exception_inf"><h4>${error.message}</h4></div>`;
  }
}
const excel_file_input = document.querySelector('.excel_name_output_custom')
excel_file_input.addEventListener('input', () => {
  if (excel_file_input.value.trim() != "") {
    xlsx_output = null
    if (last_clicked_xlsx_btn != null)
      last_clicked_xlsx_btn.classList.remove('a')

    document.querySelector('.excel_sheet_input_content').innerHTML = ''
    document.querySelector('.excel_name_output_content').classList.add('off')
    xlsx_output = excel_file_input.value.trim()
  } else {
    document.querySelector('.excel_sheet_input_content').innerHTML = '<div class="exception_inf"><h4>Choise the excel file</h4></div>'
    document.querySelector('.excel_name_output_content').classList.remove('off')
  }
})

const separator_input = document.querySelector('.csv_data_separator')
separator_input.addEventListener('input', () => {
  if (separator_input.value != "") {
    document.querySelector('.example_separators').classList.add('off')
    separator = separator_input.value

    if (last_clicked_separator_btn != null)
      last_clicked_separator_btn.classList.remove('a')
  } else {
    document.querySelector('.example_separators').classList.remove('off')
  }
})

const excel_sheet_name_input = document.querySelector('.excel_sheet_input')
excel_sheet_name_input.addEventListener('input', () => {
  if (excel_sheet_name_input.value != "") {
    document.querySelector('.excel_sheet_input_content').classList.add('off')
    excel_sheet_name = excel_sheet_name_input.value

    if (last_clicked_excel_sheet_btn != null)
      last_clicked_excel_sheet_btn.classList.remove('a')
  } else {
    document.querySelector('.excel_sheet_input_content').classList.remove('off')
  }
})


async function startMainScript(csvName, sep, excelName, sheetName) {
  if (!csv_file_name) {
    document.querySelector('.result_info h4').textContent = "Указание CSV файла обязательно!";
    return;
  }
  try {
    const response = await fetch(`${url}/start-script`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        csv_name: csvName,
        sep: sep,
        excel_name: excelName,
        sheet_name: sheetName
      })
    });

    if (response.status === 200) {
      document.querySelector('.result_info h4').textContent = "Скрипт успешно выполнен!";
    } else if (response.status === 400) {
      document.querySelector('.result_info h4').textContent = "Ошибка: Неверные параметры";
    } else if (response.status === 404) {
      document.querySelector('.result_info h4').textContent = "Ошибка: Скрипт или файл не найден";
    } else {
      document.querySelector('.result_info h4').textContent = `Ошибка выполнения скрипта. Код: ${response.status}`;
    }
  } catch (error) {
    document.querySelector('.result_info h4').textContent = `Ошибка подключения к серверу: ${error}`;
  }
}

document.querySelector('.run_script_btn').addEventListener('click', () => {
  document.querySelector('.result_info h4').textContent = "Working..."
  
  
  startMainScript(csv_file_name, separator, xlsx_output, excel_sheet_name)
})


function createExcelSheetInf(name) {
  const excelSheetInput = document.querySelector('.excel_sheet_input_content');

  const excelSheet = document.createElement('button')
  excelSheet.classList.add('excel_sheet')
  excelSheet.innerHTML = '<i class="fa-solid fa-table"></i>'
  excelSheetInput.append(excelSheet)

  const excelSheetName = document.createElement('h5')
  excelSheetName.classList.add('excel_sheet_name')
  excelSheetName.textContent = name
  excelSheet.append(excelSheetName)
}

async function getExcelSheets(fileName) {
  try {
    const response = await fetch(`${url}/xlsx-sheets?file=${encodeURIComponent(fileName)}`);
    if (!response.ok) {
      throw new Error(`Ошибка запроса: ${response.status}`);
    }

    const data = await response.json();
    if (data.sheets) {
      document.querySelector('.excel_sheet_input_content').innerHTML = ''
      data.sheets.forEach(el => {
        createExcelSheetInf(el)
      })
    } else {
      console.warn("Нет данных о листах");
    }

  } catch (error) {
    console.error('Ошибка при получении данных:', error);
  }
}


setInterval(fetchFiles, 1000);
