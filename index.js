const fs = require("fs");
const yargs = require("yargs").argv;
const path = yargs.path;

const reportHeader = `<!DOCTYPE html>
<html>
  <head>
    <title>Cucumber Feature Report</title>
    <style type="text/css">
     body {
    font: 16px Calibri, Courier, monospace;
}
h1, h2, h3, h4, p {
    margin: 0;
    padding: 0;
}
.highlight {
    color: #111111;
    font-weight: bold;
}
.failed {
    background-color: #ff9999;
}
.passed {
    background-color: #99ff99;
}
.skipped {
	background-color: #ffff80;
}
.undefined {
	background-color: #cccccc;
}
.step {
    margin: 10px;
}
.step .text {
    border-radius: 3px;
    color: #666666;
    padding: 5px;
    display: block;
}
.container {
    background: #f8f8f8;
    border-radius: 5px;
    border: 1px solid #e8e8e8;
    padding: 10px;
    margin: 10px;
}
    </style>
    <meta charset="UTF-8">
  </head>
  <body>`;

const reportEnd = `</body></html>`;

const reportData = JSON.parse(fs.readFileSync(path));

function processSteps(steps) {
    let result = '';
    steps.forEach((step) => {
        if (step.keyword !== 'After') {
            result += `<div class="step"><p> 
            <span class="text ${step.result.status}">    
            <span class="keyword highlight"> ${step.keyword} </span> ${step.name} </span></p></div>`;
        }
        if (step.embeddings !== undefined) {
            let image = new Buffer.from(step.embeddings[0].data, 'base64');
            if (!fs.existsSync('screenshots')) {
                fs.mkdirSync('screenshots');
            }
            let screenshotPath = './screenshots/' + step.duration + '.png';
            fs.writeFileSync(screenshotPath, image, 'base64');
            result += result + `<img src='${screenshotPath}'>`;
        }
    });
    return result;
}

function processElements(elements) {
    let result = '';
    let elementIndex = 0;
    elements.forEach((element) => {
        elementIndex += 1;
        result += `<div class="element container">
        <h3 class="title"><span class="highlight">Scenario ${elementIndex}: </span>${element.name}</h3>
        ${processSteps(element.steps)}</div>`;
    });
    return result;
}

function processFeatures(features) {
    let result = '';
    let featureIndex = 0;
    features.forEach((feature) => {
        featureIndex += 1;
        result += `<div class="feature container">
        <h3 class="title"><span class="highlight">Feature ${featureIndex}: </span>${feature.name}</h3>
        ${processElements(feature.elements)}</div>`;
    });
    return result;
}

const report = reportHeader + processFeatures(reportData) + reportEnd;
fs.writeFileSync('report.html', report.toString(), 'utf8');