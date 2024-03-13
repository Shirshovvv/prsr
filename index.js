//Подключаем библиотеки
const puppeteer = require('puppeteer'); //puppeteer - библиотека для работы с браузером
const excel = require('excel4node'); //excel4node - библиотека для работы с excel таблицами


const workbook = new excel.Workbook(); //Инициализируем библиотеку excel4node

const worksheet = workbook.addWorksheet('Sheet 1');

//Стили для таблиц
const style = workbook.createStyle({
  font: {
    color: '#000000',
    size: 12
  },
  numberFormat: '$#,##0.00; ($#,##0.00); -'
});
//Стили для заголовков таблиц
const styleHeadings = workbook.createStyle({
    font: {
      color: '#000000',
      size: 14
    },
    numberFormat: '$#,##0.00; ($#,##0.00); -'
});

//Создаём разметку для таблиц (Потом оптимизирую в цикл, чтобы не было строк повторяющегося кода)
worksheet.cell(1,1).string('Марка').style(styleHeadings);
worksheet.cell(1,2).string('Модель').style(styleHeadings);
worksheet.cell(1,3).string('Цена').style(styleHeadings);
worksheet.cell(1,4).string('Пробег').style(styleHeadings);
worksheet.cell(1,5).string('Год выпуска').style(styleHeadings);
worksheet.cell(1,6).string('Мощность двигателя').style(styleHeadings);
worksheet.cell(1,7).string('Тип кузова').style(styleHeadings);
worksheet.cell(1,8).string('Цвет').style(styleHeadings);
worksheet.cell(1,9).string('Коробка передач').style(styleHeadings);
worksheet.cell(1,10).string('Объем двигателя').style(styleHeadings);
worksheet.cell(1,11).string('Привод').style(styleHeadings);
worksheet.cell(1,12).string('ссылка на Фото').style(styleHeadings);


let allCarsLinks = []; //Массив с сылками авто
let carsInfo = []; //Массив с данными авто


(async ()=>{
    function asyncFunction() {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {

                const browser = await puppeteer.launch({headless: false}); //Инициализируем библиотеку puppeteer
                const page = await browser.newPage(); 
                await page.goto('https://mindauto.ru/new'); //Переходим на страницу с карточками авто
                console.log('going to catalog page');
                
                //Функция для сбора ссылок в массив
                function setLinkToArr() {
                    console.log('copy the links...')
                    return new Promise((resolve) => {
                        setTimeout(async () => {
                            let arr = await page.evaluate(()=>{
                                let carLinks = Array.from(document.querySelectorAll('.card_wrapper'), el => el.getAttribute('href'))
                                return carLinks // Возвращает массив ссылок со страницы
                            })
                            arr.forEach(name=>{
                                allCarsLinks.push(name) // Записывает данные из массива ссылок с конкретной страницы, в общий массив ссылок (массивы мои массивы)
                            })
                            resolve();
                            return
                        }, 500);
                    });
                };

                let pageNumbers = await page.evaluate(()=>{
                    const pageNumbersBlock = document.querySelectorAll('.page__numbers')[(document.querySelectorAll('.page__numbers').length - 1)].innerText
                    return pageNumbersBlock // Возвращает число страниц, исходя из цифры в последней кнопке навигации 
                });

                console.log(`pagenumbers is ${Number(pageNumbers)}`)

                for(let i = 1; i <= Number(pageNumbers); i++){
                    console.log(`going to ${i} page`)
                    await setLinkToArr()
                    await page
                    .waitForSelector('.page__btn') // Проверка на то, что на странице есть кнопка "Далее" в навигации
                    .then(async () => {
                        const pageBtn = await page.waitForSelector('.page__btn');
                        await pageBtn.click(); // Клик на кнопку "Далее" в навигации, переход на следующую страницу
                    })
                    .catch(() => {
                        console.log("can't find a next page selector"); // Если её нет, в консоль падает сообщение, и код работает дальше
                    });
                };
                console.log('browser closed')
                await browser.close(); // Закрываем браузер
                if (allCarsLinks.length > 0) {
                    resolve();
                } else {
                    reject('Массив пустой');
                }
            }, 2000);
        });
    }
    asyncFunction()
    .then(async () => {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();

        //Перебор всех ссылок в массиве
        for(let i = 1; i < allCarsLinks.length; i++){

            await page.goto(`https://mindauto.ru${allCarsLinks[i]}`); //Переходим на страницу тачки

            let car; //Создаём переменную в которую поместим объект
            await page
            .waitForSelector('.card__item-value')
            .then(async () => {
                let mark = await page.evaluate(()=>{
                    let carMark = document.querySelector('.title-span').innerText.split(" ")
                    return carMark[0] //Возвращает марку (string)
                })
                let model = await page.evaluate(()=>{
                    const regex = /^.*?\s/gm;
                    let carModel = document.querySelector('.title-span').innerText
                    const subst = ``;
                    const regexResult = carModel.replace(regex, subst);
                    const modelName = regexResult.split(",")
                    return modelName[0] // Возвращает модель (string)
                })
                let price = await page.evaluate(()=>{
                    let carPrice = document.querySelector('.price').innerText.split("₽")
                    return carPrice[0] // Возвращает цену (string)
                })
                let arrInfo = await page.evaluate(()=>{
                    let dataArr = [];
                    let carInfo = document.querySelectorAll('.card__item-value');
                    carInfo.forEach(infoBlock=>{
                        if(infoBlock.parentElement.querySelector('.card__item-title').innerText !== 'VIN'){
                            dataArr.push(infoBlock.innerText)
                        }
                    });
                    return dataArr; // Возвращает данные авто (array)
                })
                let carImg = await page.evaluate(()=>{
                    let imgArr = [];
                    let images = document.querySelectorAll('img[data-lazy-src]');
                    images.forEach(img=>{
                        if(img.dataset.lazySrc !== ''){
                            imgArr.push(' ' + img.dataset.lazySrc)
                        }
                    });
                    return imgArr; // Возвращает фото авто (array)
                })
                
                //Записываем данные конкретного автомобиля в переменную
                car = {
                    mark: mark,
                    model:  model,
                    price: price,
                    run: arrInfo[1],
                    year: arrInfo[0],
                    horsePower: arrInfo[7].split(". ")[1],
                    bodyType: arrInfo[4],
                    color: arrInfo[8],
                    transmisson: arrInfo[3],
                    displacement: arrInfo[7].split(". ")[0],
                    driveType: arrInfo[6],
                    images: carImg
                }
                carsInfo.push(car) //Пушим переменную с данными об авто в массив
            });
        };
        await browser.close();
    })
    .then(()=>{
        //Перебираем массив с данными об авто и записываем данные в уже инициализированную ранее таблицу (Потом оптимизирую чтобы не было строк повторяющегося кода)
        for(let i = 1; i < carsInfo.length; i++){
            worksheet.cell((i + 1),1).string(carsInfo[i].mark).style(style); //Марка
            worksheet.cell((i + 1),2).string(carsInfo[i].model).style(style); //Модель
            worksheet.cell((i + 1),3).string(carsInfo[i].price).style(style); //Цена
            worksheet.cell((i + 1),4).string(carsInfo[i].run).style(style); //Пробег
            worksheet.cell((i + 1),5).string(carsInfo[i].year).style(style); //Год выпуска
            worksheet.cell((i + 1),6).string(carsInfo[i].horsePower).style(style); //Лошадиные силы
            worksheet.cell((i + 1),7).string(carsInfo[i].bodyType).style(style); //Тип кузова
            worksheet.cell((i + 1),8).string(carsInfo[i].color).style(style); //Цвет (по хорошему надо HEX добавить тоже, но пока лень и задачи такой нет)
            worksheet.cell((i + 1),9).string(carsInfo[i].transmisson).style(style); //Коробка
            worksheet.cell((i + 1),10).string(carsInfo[i].displacement).style(style); //Объём двигателя
            worksheet.cell((i + 1),11).string(carsInfo[i].driveType).style(style); //Привод
            worksheet.cell((i + 1),12).string(carsInfo[i].images.toString()).style(style); //Фото
        }
    })
    .then(async ()=>{
        workbook.write('Excel.xlsx'); // Создаём таблицу
    })
    .catch((error) => {
        console.log('Ошибка:', error);
    });
})()


