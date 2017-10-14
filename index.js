
const cheerio = require('cheerio');
const request = require('request');
const fs      = require('fs');

let _URL = {
    URL_BASE: `https://horarios.fime.me/dependencia/2316/periodo/3100929/`,
    
    //URL_BASE: `https://horarios.fime.me/dependencia/2316/periodo/3101628,`,

    ArrayAlphabet() {
        let a = [];
        for (var index = 97; index <= 122; index++) {
            a.push(String.fromCharCode(index));   
        }
        return a
    },

    generateUrlByAlphabet() {
        let _arr = []
        this.ArrayAlphabet().map(alphabet => {
            _arr.push({
                alphabet: alphabet,
                url: this.URL_BASE + `materias/${alphabet}`
            })
        })
        return _arr
    }
}

let Scrapp = {
    BASE_URL: 'https://horarios.fime.me',

    init(){

        let element = {
            alphabet: 'a', 
            url: 'https://horarios.fime.me/dependencia/2316/periodo/3100929/materias/a'
        }

        let _arr_URL = _URL.generateUrlByAlphabet()
        let _arr = []
        
        _arr_URL.map(el => {
            this.scrapAssigmentTable(el.url, el.alphabet)
                .then(result => {
                    
                    _json = JSON.stringify(result);
                    
                    fs.writeFile( './static/' + result.alphabet + '.json', _json, 'utf8', function(err){
                        if(err){console.log(err)}
                    });
                }).catch(e => {
                    console.log(e)
                })   
        })
        
    },

    scrapAssigmentTable(_url, _alphabet) {
        return new Promise((resolve, reject) => {

            request(_url, (error, response, html) => {
                if(!error){
                    let $ = cheerio.load(html);
                    let assigments = []
                    let _obj = {}

                    $ = cheerio.load($('.well').html())
                    _assigments_size = $('a').length;
                    _cont = 0;

                    $('a').each( (i, element) => {
                        let _assigment = element.children[0].data
                        let _plan = () => {
                            return _assigment.match(/\(([^)]+)\)/)[1]
                        }
                        
                        //let _a = _assigment.replace(/\(.*?\)/, '');
                        
                        _cont += 1;

                        assigments.push({ 
                            plan: _plan(),
                            assigment: _assigment.trim(), 
                            url: this.BASE_URL + element.attribs.href 
                        })    
                        
                        if(_cont == _assigments_size ) {
                            let _obj = {
                                alphabet: _alphabet,
                                count: _assigments_size,
                                data: assigments
                            }
                            resolve(_obj)
                        }
                    })
                } else {
                    console.log('something was wrong');
                    reject(error)
                }
            })
        })
    }

}

let init = () => {
    Scrapp.init()
}

init()