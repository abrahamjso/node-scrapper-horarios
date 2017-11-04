// External Libraries
const cheerio = require('cheerio');
const request = require('request');
const requestPromise = require('request-promise-native');
const fs = require('fs');
const _ = require('underscore');

// My Libraries
// ...

// My Constants
const jsonDir = './static';

const setup = {
  getJsonFormatFromString(string) { return JSON.parse(string); },

  getFilesFromDir(dir) {
    return new Promise((resolve) => {
      const files = fs.readdirSync(dir);
      const arrayJson = files.map(file => this.getJsonFormatFromString(fs.readFileSync(`${jsonDir}/${file}`, 'utf8')));
      resolve(arrayJson);
    });
  },

  setAssignaturesListFromJsonList(jsonList = []) {
    return new Promise((resolve) => {
      const assigments = { count: 0, data: [] };
      jsonList.map((json) => {
        assigments.count += json.data.length;
        json.data.map(assigment => assigments.data.push(assigment));
      });
      resolve(assigments);
    });
  },

  init(dir) {
    return new Promise((resolve) => {
      this.getFilesFromDir(dir)
        .then(result => this.setAssignaturesListFromJsonList(result))
        .then(result => resolve(result));
    });
  },
};

function validateElement(i, element) {
  const obj = {};
  switch (i) {
    case 0:
      obj.plan = element;
      break;
    case 1:
      obj.clave = element;
      break;
    case 2:
      obj.group = element;
      break;
    case 3:
      obj.room = element;
      break;
    case 4:
      obj.language = element;
      break;
    case 5:
      obj.modality = element;
      break;
    case 6:
      if (element) {
        obj.day = 'Lunes';
        obj.hour = element;
      }
      break;
    case 7:
      if (element) {
        obj.day = 'Martes';
        obj.hour = element;
      }
      break;
    case 8:
      if (element) {
        obj.day = 'Miercoles';
        obj.hour = element;
      }
      break;
    case 9:
      if (element) {
        obj.day = 'Jueves';
        obj.hour = element;
      }
      break;
    case 10:
      if (element) {
        obj.day = 'Viernes';
        obj.hour = element;
      }
      break;
    case 11:
      if (element) {
        obj.day = 'Sabado';
        obj.hour = element;
      }
      break;
    case 12:
      obj.teacher = element;
      break;
    default:
      break;
  }
  return obj;
}

function reasignNewObjectFromTDS(tds, assigment) {
  const cleanObj = { assigment };
  tds.map((i, element) => Object.assign(
    cleanObj
    , validateElement(i, cheerio.load(element).text()),
  ));
  const hours = cleanObj.hour.split(' ');
  // console.log('hours: ' + hours);
  // if (hours.length > 1) {
  //   console.log('--' + hours + 'split...');
  // }
  return cleanObj;
}

async function separateHours(assigmentHour) {
  // return new Promise((resolve) => {
  const hours = assigmentHour.hour.split(' ');
  if (hours.length > 1) {
    const arrObj = [];
    hours.forEach((hour) => {
      const newObj = Object.assign({}, assigmentHour);
      newObj.hour = hour;
      arrObj.push(newObj);
      // console.log(arrObj);
    }, this);
    console.log(arrObj);
    await arrObj;
  }
  await assigmentHour;
  // });
}

function getAssigments(html, assigment) {
  let $ = cheerio.load(html);
  const trList = $('.horarios tbody').children();
  console.log(trList.length);

  const objArr = [];
  for (let index = 0; index < trList.length; index += 1) {
    const tdList = trList[index].children;
    $ = cheerio.load(tdList);
    const td = reasignNewObjectFromTDS($('td'), assigment);
    // separateHours(td);
    objArr.push(td);
  }
  return objArr;
}

const ABRequestor = {
  jsonAssigmentObj: {},

  async reqsPromise(_jsonAssigmenstObj) {
    let arrToReq = _jsonAssigmenstObj.data;
    const fullAsigments = [];
    arrToReq = [_jsonAssigmenstObj.data[0], _jsonAssigmenstObj.data[1]];
    const reqs = arrToReq.map(async (toReq) => {
      const html = await requestPromise.get(toReq.url);
      console.log(toReq);
      const arrAssigment = getAssigments(html, toReq.assigment);
      fullAsigments.push(...arrAssigment);
    });

    await Promise.all(reqs);
    return fullAsigments;
  },

  doAssigmentRequest(url) {
    console.log(url);
    request(url, (error, response, html) => {
      if (!error) {
        let $ = cheerio.load(html);

        const trList = $('.horarios tbody').children();
        console.log(trList.length);

        const objArr = [];
        for (let index = 0; index < trList.length; index += 1) {
          const tdList = trList[index].children;
          $ = cheerio.load(tdList);
          const td = reasignNewObjectFromTDS($('td'));
          objArr.push(td);
        }
        console.log(objArr);
      }
    });
  },
};

const ABTransformation = {
  uniques(array) {
    console.log('totals: ' + array.length);
    const uniqueTeachers = this.getUniquesInArrayByKey(array, 'teacher');
    const uniqueAssigments = this.getUniquesInArrayByKey(array, 'assigment');
    const uniqueRooms = this.getUniquesInArrayByKey(array, 'room');
    console.log(`teachers: ${uniqueTeachers.length}`);
    console.log(`assigments: ${uniqueAssigments.length}`);
    console.log(`rooms: ${uniqueRooms.length}`);
    //console.log(uniqueTeachers);
  },
  getUniquesInArrayByKey(array, key) {
    return _.uniq(array, (obj) => obj[key]);
  } 
};

setup.init(jsonDir)
  .then(ABRequestor.reqsPromise)
  .then((result) => {
    console.log(result);
    ABTransformation.uniques(result);
  });
