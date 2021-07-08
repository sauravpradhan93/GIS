import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import Overlay from 'ol/Overlay';
import { toStringHDMS } from 'ol/coordinate.js';
import { fromLonLat } from 'ol/proj.js';
import { toLonLat } from 'ol/proj.js';
import { InfoService } from '../services/info.service';
import { InfoModel } from '../model/info.model';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { Fill, Stroke, Style } from 'ol/style';
import { CountryService } from '../services/country.service'
import { HttpClient } from '@angular/common/http'
// import { $ } from 'protractor';

@Component({
  selector: 'app-map-component',
  templateUrl: './map-component.component.html',
  styleUrls: ['./map-component.component.css'],
})

export class MapComponentComponent implements OnInit {
  infos: InfoModel[];
  constructor(

    private infoService: InfoService,
    public countryApi: CountryService,
    private http: HttpClient,
  ) { }


  ngOnInit() {
    this.infoService.getInfo().subscribe(infos => {
      console.log(infos);
    });

    this.intializeMap();
  }

  intializeMap() {

    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');

    const overlay = new Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });

    const map = new Map({

      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      overlays: [overlay],
      target: 'hotel_map',
      view: new View({
        projection: 'EPSG:4326',
        center: [37.41, 8.82],
        zoom: 2.7
      })
    });

    this.http.get('assets/world_borders_simple.geojson').subscribe((geoJson: any) => {
      var vectorSource = new VectorSource({
        features: (new GeoJSON().readFeatures(geoJson))
      });
      var vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          stroke: new Stroke({
            color: 'rgba(76, 143, 245, 0.5)',
            lineDash: [1],
            width: 1.5
          }),
          fill: new Fill({
            color: 'rgba(255, 165, 0, 0)'
          })
        })

      })
      map.addLayer(vectorLayer);
    });





    closer.onclick = function () {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    var countryCountJson = {}
    let s = this.countryApi.GetCountriesList();
    s.snapshotChanges().subscribe(data => { // Using snapshotChanges() method to retrieve list of data along with metadata($key)
      var largestCaseCount = 0;
      var largestDeathCount = 0;
      data.forEach(item => {
        let a = item.payload.toJSON();
        a['$key'] = item.key;
        countryCountJson[a["country"]] = {
          "covid_cases": a["case_count"],
          "covid_deaths": a["death_count"],
          "covid_recover": a["case_recovered"]
        }
        if (largestCaseCount < a["case_count"]) {
          largestCaseCount = a["case_count"]
        }
        if (largestDeathCount < a["death_count"]) {
          largestDeathCount = a["death_count"];
        }
      })
      map.on('pointermove', function (evt) {
        const coordinate = evt.coordinate;
        const hdms = toStringHDMS(toLonLat(coordinate));
        if (this.getFeaturesAtPixel(evt.pixel).length > 0) {
          const countryName = this.getFeaturesAtPixel(evt.pixel)[0].get("NAME");
          if (countryCountJson[countryName] !== undefined) {
            content.innerHTML = 'Country: ' + countryName + '<br/>No. of cases: <code>' + countryCountJson[countryName]["covid_cases"] + '</code>' +
              '<br/> Deaths: <code>' + countryCountJson[countryName]["covid_deaths"] + '</code>' +
              '<br/>No. of recovery: <code>' + countryCountJson[countryName]["covid_recover"]; 
            overlay.setPosition(coordinate);
          } else {
            overlay.setPosition(undefined);
            closer.blur();
          }
        } else {
          overlay.setPosition(undefined);
          closer.blur();
        }
      });

      var casesSlider = document.getElementById("casesSlider");
      casesSlider["min"] = 0;
      casesSlider["max"] = largestCaseCount;
      casesSlider["value"] = largestCaseCount;
      var deathsSlider = document.getElementById("deathsSlider");
      deathsSlider["min"] = 0;
      deathsSlider["max"] = largestDeathCount;
      deathsSlider["value"] = largestDeathCount;
      var casesValue = document.getElementById("casesSliderValue");
      var deathsValue = document.getElementById("deathsSliderValue");
      casesValue.innerHTML = largestCaseCount.toString();
      deathsValue.innerHTML = largestDeathCount.toString();
      casesSlider.oninput = function () {
        casesValue.innerHTML = casesSlider["value"];
        map.getLayers().array_[1].setStyle(function (feature) {
          var caseRainbow = new Rainbow();
          caseRainbow.setNumberRange(0, largestCaseCount);
          caseRainbow.setSpectrum('#fdfdfd', '#ff5400');
          if (countryCountJson[feature.getProperties().NAME] !== undefined) {
            var featureCaseCount = countryCountJson[feature.getProperties().NAME].covid_cases;
            if (featureCaseCount <= Number(casesSlider["value"])) {
              var styleColor = "#" + caseRainbow.colorAt(featureCaseCount);
              return new Style({
                stroke: new Stroke({
                  color: "#ff5400",
                  lineDash: [1],
                  width: 1.5
                }),
                fill: new Fill({
                  color: styleColor
                })
              })
            } else {
              new Style({
                stroke: new Stroke({
                  color: 'rgba(76, 143, 245, 0.5)',
                  lineDash: [1],
                  width: 1.5
                }),
                fill: new Fill({
                  color: 'rgba(255, 165, 0, 0)'
                })
              })
            }
          } else {
            new Style({
              stroke: new Stroke({
                color: 'rgba(76, 143, 245, 0.5)',
                lineDash: [1],
                width: 1.5
              }),
              fill: new Fill({
                color: 'rgba(255, 165, 0, 0)'
              })
            })
          }

        });
      }

      deathsSlider.oninput = function () {
        deathsValue.innerHTML = deathsSlider["value"];
        map.getLayers().array_[1].setStyle(function (feature) {
          var deathRainbow = new Rainbow();
          deathRainbow.setNumberRange(0, largestDeathCount);
          deathRainbow.setSpectrum('#fdfdfd', '#ff5400');
          if (countryCountJson[feature.getProperties().NAME] !== undefined) {
            var featureDeathCount = countryCountJson[feature.getProperties().NAME].covid_deaths;
            if (featureDeathCount <= Number(deathsSlider["value"])) {
              var styleColor = "#" + deathRainbow.colorAt(featureDeathCount);
              return new Style({
                stroke: new Stroke({
                  color: "#ff5400",
                  lineDash: [1],
                  width: 1.5
                }),
                fill: new Fill({
                  color: styleColor
                })
              })
            } else {
              new Style({
                stroke: new Stroke({
                  color: 'rgba(76, 143, 245, 0.5)',
                  lineDash: [1],
                  width: 1.5
                }),
                fill: new Fill({
                  color: 'rgba(255, 165, 0, 0)'
                })
              })
            }
          } else {
            new Style({
              stroke: new Stroke({
                color: 'rgba(76, 143, 245, 0.5)',
                lineDash: [1],
                width: 1.5
              }),
              fill: new Fill({
                color: 'rgba(255, 165, 0, 0)'
              })
            })
          }

        });

      }

      var casesCheckbox = document.getElementById("casesCheckSwitch");
      var deathsCheckbox = document.getElementById("deathsCheckSwitch");
      var checkboxSwitches = document.getElementsByClassName("sliderSwitch");
      for (var i = 0; i < checkboxSwitches.length; i++) {
        var checkboxSwitch = checkboxSwitches[i];
        checkboxSwitch["onchange"] = function () {

          if (this["id"] !== "casesCheckSwitch") {
            casesCheckbox["checked"] = false;
            casesSlider["disabled"] = true;
          } else if (this["id"] !== "deathsCheckSwitch") {
            deathsCheckbox["checked"] = false;
            deathsSlider["disabled"] = true;
          }

          if (casesCheckbox["checked"] === true) {
            casesSlider["disabled"] = false;
            map.getLayers().array_[1].setStyle(function (feature) {
              var caseRainbow = new Rainbow();
              caseRainbow.setNumberRange(0, largestCaseCount);
              caseRainbow.setSpectrum('#fdfdfd', '#ff5400');
              if (countryCountJson[feature.getProperties().NAME] !== undefined) {
                var featureCaseCount = countryCountJson[feature.getProperties().NAME].covid_cases;
                if (featureCaseCount <= Number(casesSlider["value"])) {
                  var styleColor = "#" + caseRainbow.colorAt(featureCaseCount);
                  return new Style({
                    stroke: new Stroke({
                      color: "#ff5400",
                      lineDash: [1],
                      width: 1.5
                    }),
                    fill: new Fill({
                      color: styleColor
                    })
                  })
                } else {
                  new Style({
                    stroke: new Stroke({
                      color: 'rgba(76, 143, 245, 0.5)',
                      lineDash: [1],
                      width: 1.5
                    }),
                    fill: new Fill({
                      color: 'rgba(255, 165, 0, 0)'
                    })
                  })
                }
              } else {
                new Style({
                  stroke: new Stroke({
                    color: 'rgba(76, 143, 245, 0.5)',
                    lineDash: [1],
                    width: 1.5
                  }),
                  fill: new Fill({
                    color: 'rgba(255, 165, 0, 0)'
                  })
                })
              }

            });
          } else if (deathsCheckbox["checked"] === true) {
            deathsSlider["disabled"] = false;

            map.getLayers().array_[1].setStyle(function (feature) {
              var deathRainbow = new Rainbow();
              deathRainbow.setNumberRange(0, largestDeathCount);
              deathRainbow.setSpectrum('#fdfdfd', '#ff5400');
              if (countryCountJson[feature.getProperties().NAME] !== undefined) {
                var featureDeathCount = countryCountJson[feature.getProperties().NAME].covid_deaths;
                if (featureDeathCount <= Number(deathsSlider["value"])) {
                  var styleColor = "#" + deathRainbow.colorAt(featureDeathCount);
                  return new Style({
                    stroke: new Stroke({
                      color: "#ff5400",
                      lineDash: [1],
                      width: 1.5
                    }),
                    fill: new Fill({
                      color: styleColor
                    })
                  })
                } else {
                  new Style({
                    stroke: new Stroke({
                      color: 'rgba(76, 143, 245, 0.5)',
                      lineDash: [1],
                      width: 1.5
                    }),
                    fill: new Fill({
                      color: 'rgba(255, 165, 0, 0)'
                    })
                  })
                }
              } else {
                new Style({
                  stroke: new Stroke({
                    color: 'rgba(76, 143, 245, 0.5)',
                    lineDash: [1],
                    width: 1.5
                  }),
                  fill: new Fill({
                    color: 'rgba(255, 165, 0, 0)'
                  })
                })
              }

            });
          }

          if (casesCheckbox["checked"] === false && deathsCheckbox["checked"] === false) {
            map.getLayers().array_[1].setStyle(function (feature) {
              return new Style({
                stroke: new Stroke({
                  color: 'rgba(76, 143, 245, 0.5)',
                  lineDash: [1],
                  width: 1.5
                }),
                fill: new Fill({
                  color: 'rgba(255, 165, 0, 0)'
                })
              })
            });
            checkboxSwitch["checked"] = false;
            deathsCheckbox["checked"] = false;
            casesSlider["disabled"] = true;
            deathsSlider["disabled"] = true;
          } else if (casesCheckbox["checked"] === false) {
            casesSlider["disabled"] = true;
          } else if (deathsCheckbox["checked"] === false) {
            deathsSlider["disabled"] = true;
          }
        }
      }


    });
  }
}

/*
RainbowVis-JS 
Released under Eclipse Public License - v 1.0
*/

function Rainbow() {
  "use strict";
  var gradients = null;
  var minNum = 0;
  var maxNum = 100;
  var colours = ['ff0000', 'ffff00', '00ff00', '0000ff'];
  setColours(colours);

  function setColours(spectrum) {
    if (spectrum.length < 2) {
      throw new Error('Rainbow must have two or more colours.');
    } else {
      var increment = (maxNum - minNum) / (spectrum.length - 1);
      var firstGradient = new ColourGradient();
      firstGradient.setGradient(spectrum[0], spectrum[1]);
      firstGradient.setNumberRange(minNum, minNum + increment);
      gradients = [firstGradient];

      for (var i = 1; i < spectrum.length - 1; i++) {
        var colourGradient = new ColourGradient();
        colourGradient.setGradient(spectrum[i], spectrum[i + 1]);
        colourGradient.setNumberRange(minNum + increment * i, minNum + increment * (i + 1));
        gradients[i] = colourGradient;
      }

      colours = spectrum;
    }
  }

  this.setSpectrum = function () {
    setColours(arguments);
    return this;
  }

  this.setSpectrumByArray = function (array) {
    setColours(array);
    return this;
  }

  this.colourAt = function (number) {
    if (isNaN(number)) {
      throw new TypeError(number + ' is not a number');
    } else if (gradients.length === 1) {
      return gradients[0].colourAt(number);
    } else {
      var segment = (maxNum - minNum) / (gradients.length);
      var index = Math.min(Math.floor((Math.max(number, minNum) - minNum) / segment), gradients.length - 1);
      return gradients[index].colourAt(number);
    }
  }

  this.colorAt = this.colourAt;

  this.setNumberRange = function (minNumber, maxNumber) {
    if (maxNumber > minNumber) {
      minNum = minNumber;
      maxNum = maxNumber;
      setColours(colours);
    } else {
      throw new RangeError('maxNumber (' + maxNumber + ') is not greater than minNumber (' + minNumber + ')');
    }
    return this;
  }
}

function ColourGradient() {
  "use strict";
  var startColour = 'ff0000';
  var endColour = '0000ff';
  var minNum = 0;
  var maxNum = 100;

  this.setGradient = function (colourStart, colourEnd) {
    startColour = getHexColour(colourStart);
    endColour = getHexColour(colourEnd);
  }

  this.setNumberRange = function (minNumber, maxNumber) {
    if (maxNumber > minNumber) {
      minNum = minNumber;
      maxNum = maxNumber;
    } else {
      throw new RangeError('maxNumber (' + maxNumber + ') is not greater than minNumber (' + minNumber + ')');
    }
  }

  this.colourAt = function (number) {
    return calcHex(number, startColour.substring(0, 2), endColour.substring(0, 2))
      + calcHex(number, startColour.substring(2, 4), endColour.substring(2, 4))
      + calcHex(number, startColour.substring(4, 6), endColour.substring(4, 6));
  }

  function calcHex(number, channelStart_Base16, channelEnd_Base16) {
    var num = number;
    if (num < minNum) {
      num = minNum;
    }
    if (num > maxNum) {
      num = maxNum;
    }
    var numRange = maxNum - minNum;
    var cStart_Base10 = parseInt(channelStart_Base16, 16);
    var cEnd_Base10 = parseInt(channelEnd_Base16, 16);
    var cPerUnit = (cEnd_Base10 - cStart_Base10) / numRange;
    var c_Base10 = Math.round(cPerUnit * (num - minNum) + cStart_Base10);
    return formatHex(c_Base10.toString(16));
  }

  function formatHex(hex) {
    if (hex.length === 1) {
      return '0' + hex;
    } else {
      return hex;
    }
  }

  function isHexColour(string) {
    var regex = /^#?[0-9a-fA-F]{6}$/i;
    return regex.test(string);
  }

  function getHexColour(string) {
    if (isHexColour(string)) {
      return string.substring(string.length - 6, string.length);
    } else {
      var name = string.toLowerCase();
      if (colourNames.hasOwnProperty(name)) {
        return colourNames[name];
      }
      throw new Error(string + ' is not a valid colour.');
    }
  }

  // Extended list of CSS colornames s taken from
  // http://www.w3.org/TR/css3-color/#svg-color
  var colourNames = {
    aliceblue: "F0F8FF",
    antiquewhite: "FAEBD7",
    aqua: "00FFFF",
    aquamarine: "7FFFD4",
    azure: "F0FFFF",
    beige: "F5F5DC",
    bisque: "FFE4C4",
    black: "000000",
    blanchedalmond: "FFEBCD",
    blue: "0000FF",
    blueviolet: "8A2BE2",
    brown: "A52A2A",
    burlywood: "DEB887",
    cadetblue: "5F9EA0",
    chartreuse: "7FFF00",
    chocolate: "D2691E",
    coral: "FF7F50",
    cornflowerblue: "6495ED",
    cornsilk: "FFF8DC",
    crimson: "DC143C",
    cyan: "00FFFF",
    darkblue: "00008B",
    darkcyan: "008B8B",
    darkgoldenrod: "B8860B",
    darkgray: "A9A9A9",
    darkgreen: "006400",
    darkgrey: "A9A9A9",
    darkkhaki: "BDB76B",
    darkmagenta: "8B008B",
    darkolivegreen: "556B2F",
    darkorange: "FF8C00",
    darkorchid: "9932CC",
    darkred: "8B0000",
    darksalmon: "E9967A",
    darkseagreen: "8FBC8F",
    darkslateblue: "483D8B",
    darkslategray: "2F4F4F",
    darkslategrey: "2F4F4F",
    darkturquoise: "00CED1",
    darkviolet: "9400D3",
    deeppink: "FF1493",
    deepskyblue: "00BFFF",
    dimgray: "696969",
    dimgrey: "696969",
    dodgerblue: "1E90FF",
    firebrick: "B22222",
    floralwhite: "FFFAF0",
    forestgreen: "228B22",
    fuchsia: "FF00FF",
    gainsboro: "DCDCDC",
    ghostwhite: "F8F8FF",
    gold: "FFD700",
    goldenrod: "DAA520",
    gray: "808080",
    green: "008000",
    greenyellow: "ADFF2F",
    grey: "808080",
    honeydew: "F0FFF0",
    hotpink: "FF69B4",
    indianred: "CD5C5C",
    indigo: "4B0082",
    ivory: "FFFFF0",
    khaki: "F0E68C",
    lavender: "E6E6FA",
    lavenderblush: "FFF0F5",
    lawngreen: "7CFC00",
    lemonchiffon: "FFFACD",
    lightblue: "ADD8E6",
    lightcoral: "F08080",
    lightcyan: "E0FFFF",
    lightgoldenrodyellow: "FAFAD2",
    lightgray: "D3D3D3",
    lightgreen: "90EE90",
    lightgrey: "D3D3D3",
    lightpink: "FFB6C1",
    lightsalmon: "FFA07A",
    lightseagreen: "20B2AA",
    lightskyblue: "87CEFA",
    lightslategray: "778899",
    lightslategrey: "778899",
    lightsteelblue: "B0C4DE",
    lightyellow: "FFFFE0",
    lime: "00FF00",
    limegreen: "32CD32",
    linen: "FAF0E6",
    magenta: "FF00FF",
    maroon: "800000",
    mediumaquamarine: "66CDAA",
    mediumblue: "0000CD",
    mediumorchid: "BA55D3",
    mediumpurple: "9370DB",
    mediumseagreen: "3CB371",
    mediumslateblue: "7B68EE",
    mediumspringgreen: "00FA9A",
    mediumturquoise: "48D1CC",
    mediumvioletred: "C71585",
    midnightblue: "191970",
    mintcream: "F5FFFA",
    mistyrose: "FFE4E1",
    moccasin: "FFE4B5",
    navajowhite: "FFDEAD",
    navy: "000080",
    oldlace: "FDF5E6",
    olive: "808000",
    olivedrab: "6B8E23",
    orange: "FFA500",
    orangered: "FF4500",
    orchid: "DA70D6",
    palegoldenrod: "EEE8AA",
    palegreen: "98FB98",
    paleturquoise: "AFEEEE",
    palevioletred: "DB7093",
    papayawhip: "FFEFD5",
    peachpuff: "FFDAB9",
    peru: "CD853F",
    pink: "FFC0CB",
    plum: "DDA0DD",
    powderblue: "B0E0E6",
    purple: "800080",
    red: "FF0000",
    rosybrown: "BC8F8F",
    royalblue: "4169E1",
    saddlebrown: "8B4513",
    salmon: "FA8072",
    sandybrown: "F4A460",
    seagreen: "2E8B57",
    seashell: "FFF5EE",
    sienna: "A0522D",
    silver: "C0C0C0",
    skyblue: "87CEEB",
    slateblue: "6A5ACD",
    slategray: "708090",
    slategrey: "708090",
    snow: "FFFAFA",
    springgreen: "00FF7F",
    steelblue: "4682B4",
    tan: "D2B48C",
    teal: "008080",
    thistle: "D8BFD8",
    tomato: "FF6347",
    turquoise: "40E0D0",
    violet: "EE82EE",
    wheat: "F5DEB3",
    white: "FFFFFF",
    whitesmoke: "F5F5F5",
    yellow: "FFFF00",
    yellowgreen: "9ACD32"
  }
}
