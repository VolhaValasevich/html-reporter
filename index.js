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
.step-duration {
    float: right;
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
.screenshot {
    margin: 8px;
    width: 30%;
}
    </style>
    <meta charset="UTF-8">
  </head>
  <body>`;

const reportEnd = `</body></html>`;

const reportData = JSON.parse(fs.readFileSync(path));

function formatDuration(duration) {
    let result = '';
    if (typeof (duration) === 'number') {
        result += 'Duration:';
        let milliseconds = duration;
        let seconds = Math.floor(milliseconds / 1000);
        let minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            result += ` ${minutes}m`;
            seconds -= (minutes * 60);
        }
        if (seconds > 0) {
            result += ` ${seconds}s`;
            milliseconds -= (seconds * 1000);
        }
        result += ` ${milliseconds}ms`;
    }
    return result;
}

function processSteps(steps) {
    let result = '';
    let scenarioDuration = 0;
    steps.forEach((step) => {
        if (step.keyword !== 'After') {
            result += `<div class="step"><p> 
            <span class="text ${step.result.status}">    
            <span class="keyword highlight"> ${step.keyword} </span> ${step.name} 
            <span class="step-duration">${formatDuration(step.result.duration)}</span></span></p></div>`;
        }
        if (step.embeddings !== undefined) {
            let image = new Buffer.from(step.embeddings[0].data, 'base64');
            if (!fs.existsSync('screenshots')) {
                fs.mkdirSync('screenshots');
            }
            let screenshotPath = './screenshots/' + step.duration + '.png';
            fs.writeFileSync(screenshotPath, image, 'base64');
            result += result + `<a href='${screenshotPath}'><img src='${screenshotPath}' class="screenshot"></a>`;
        }
        if (typeof(step.result.duration) === 'number') {
            scenarioDuration += step.result.duration;
        }
    });
    return {result: result, duration: scenarioDuration} ;
}

function processElements(elements) {
    let result = '';
    let elementIndex = 0;
    let featureDuration = 0;
    elements.forEach((element) => {
        elementIndex += 1;
        const steps = processSteps(element.steps);
        result += `<div class="element container">
        <h3 class="title"><span class="highlight">Scenario ${elementIndex}: </span>${element.name}
        <span class="step-duration">${formatDuration(steps.duration)}</span></h3>
        ${steps.result}</div>`;
        featureDuration += steps.duration;
    });
    return {result: result, duration: featureDuration};
}

function processFeatures(features) {
    let result = '';
    let featureIndex = 0;
    let totalDuration = 0;
    features.forEach((feature) => {
        const scenarios = processElements(feature.elements);
        featureIndex += 1;
        result += `<div class="feature container">
        <h3 class="title"><span class="highlight">Feature ${featureIndex}: </span>${feature.name}
        <span class="step-duration">${formatDuration(scenarios.duration)}</span></h3></h3>
        ${scenarios.result}</div>`;
        totalDuration += scenarios.duration;
    });
    return {result: result, duration: totalDuration, number: featureIndex};
}

const reportBody = processFeatures(reportData);
const report = reportHeader + reportBody.result + reportEnd;
fs.writeFileSync('report.html', report.toString(), 'utf8');