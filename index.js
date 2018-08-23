const fs = require("fs");
const yargs = require("yargs").argv;
const path = yargs.path;
const reportHeader = require("./data/htmlStyles.js")

const reportEnd = `</body></html>`;

const reportData = JSON.parse(fs.readFileSync(path));

let statistics = {
    passed: 0,
    failed: 0,
    skipped: 0,
    featureNum: 0,
    scenarioNum: 0,
    testNum: 0,
    totalDuration: 0
};

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
            statistics.testNum += 1;
            statistics[step.result.status] += 1;
            result += `<div class="step"><p><span class="text ${step.result.status}">    
            <span class="keyword highlight"> ${step.keyword} </span> ${step.name} 
            <span class="float-right">${formatDuration(step.result.duration)}</span></span></p></div>`;
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
        <span class="float-right">${formatDuration(steps.duration)}</span></h3>
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
        statistics.scenarioNum += feature.elements.length;
        statistics.featureNum += 1;
        featureIndex += 1;
        result += `<div class="feature block">
        <h3 class="title" type="button" data-toggle="collapse" data-target="#feature${featureIndex}">
        <span class="highlight">Feature ${featureIndex}: </span>${feature.name}
        <span class="float-right">${formatDuration(scenarios.duration)}</span></h3>
        <div id="feature${featureIndex}" class="collapse">${scenarios.result}</div></div>`;
        totalDuration += scenarios.duration;
    });
    return {result: result, duration: totalDuration};
}

const reportBody = processFeatures(reportData);
statistics.totalDuration += reportBody.duration;
const headerPanel = `<div class="header"><span class="highlight header-text">Test results: </span><div class="float-right">
    <div><span class="passed">${statistics.passed} passed</span>
    <span class="failed">${statistics.failed} failed</span>
    <span class="skipped">${statistics.skipped} skipped</span>
    </div> <div><span>${statistics.featureNum} features, ${statistics.scenarioNum} scenarios, ${statistics.testNum} steps</span>
    </div><div><span>${formatDuration(statistics.totalDuration)}</span></div></div></div>`;
const report = reportHeader + headerPanel + reportBody.result + reportEnd;
fs.writeFileSync('report.html', report.toString(), 'utf8');