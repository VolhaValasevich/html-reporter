const fs = require("fs");
const yargs = require("yargs").argv;
const path = yargs.path;

const reportHeader = `<!DOCTYPE html>
<html>
  <head>
    <title>Cucumber Feature Report</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
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
.block {
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

function processSteps(steps, scenarioIndex) {
    let result = '';
    let scenarioDuration = 0;
    steps.forEach((step, stepIndex) => {
        if (step.keyword !== 'After') {
            result += `<div class="step"><p><span class="text ${step.result.status}">    
            <span class="keyword highlight"> ${step.keyword} </span> ${step.name} 
            <span class="step-duration">${formatDuration(step.result.duration)}</span></span></p></div>`;
        }
        if (step.embeddings !== undefined) {
            let image = new Buffer.from(step.embeddings[0].data, 'base64');
            if (!fs.existsSync('screenshots')) {
                fs.mkdirSync('screenshots');
            }
            let screenshotPath = `./screenshots/Scenario${scenarioIndex}Step${stepIndex}.png`;
            fs.writeFileSync(screenshotPath, image, 'base64');
            result += result + `<a href='${screenshotPath}' target="_blank"><img src='${screenshotPath}' class="screenshot"></a>`;
        }
        if (typeof step.result.duration === 'number') {
            scenarioDuration += step.result.duration;
        }
    });
    return {result: result, duration: scenarioDuration} ;
}

function processElements(elements, featureIndex) {
    let result = '';
    let scenarioIndex = 0;
    let featureDuration = 0;
    elements.forEach((scenario) => {
        scenarioIndex += 1;
        const steps = processSteps(scenario.steps, scenarioIndex);
        result += `<div class="element block">
        <h3 class="title" type="button" data-toggle="collapse" data-target="#feature${featureIndex}scenario${scenarioIndex}">
        <span class="highlight">Scenario ${scenarioIndex}: </span>${scenario.name}
        <span class="step-duration">${formatDuration(steps.duration)}</span></h3>
        <div id="feature${featureIndex}scenario${scenarioIndex}" class="collapse">${steps.result}</div></div>`;
        featureDuration += steps.duration;
    });
    return {result: result, duration: featureDuration};
}

function processFeatures(features) {
    let result = '';
    let featureIndex = 0;
    let totalDuration = 0;
    features.forEach((feature) => {
        const scenarios = processElements(feature.elements, featureIndex);
        featureIndex += 1;
        result += `<div class="feature block">
        <h3 class="title" type="button" data-toggle="collapse" data-target="#feature${featureIndex}">
        <span class="highlight">Feature ${featureIndex}: </span>${feature.name}
        <span class="step-duration">${formatDuration(scenarios.duration)}</span></h3>
        <div id="feature${featureIndex}" class="collapse">${scenarios.result}</div></div>`;
        totalDuration += scenarios.duration;
    });
    return {result: result, duration: totalDuration, number: featureIndex};
}

const reportBody = processFeatures(reportData);
const report = reportHeader + reportBody.result + reportEnd;
fs.writeFileSync('report.html', report.toString(), 'utf8');