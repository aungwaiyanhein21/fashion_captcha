window.onload = init;

const PLAYER = 0;
const BOT = 1;

//const NO_OF_IMG_PER_CLASS = 3;  
const FILE_EXTENSION = ".png";

var gameTurn = PLAYER; // for testing. Actual: will start with player

const ORIGINAL_IMG_PATH = "img/original_img/";
const PREPROCESSED_IMG_PATH = "img/preprocessed_img/";
const NEW_TEST_IMG_PATH = "img/new_test_img/"

var imgsPathObj = {};
var origImgsPathObj = {};

var randImagesClasses = [];
var randImagesPaths = [];

// for testing
var incorrectAnswersImg = [];

var stats = {};


var totalImgs = 0;
var noOfImagesShownEachTime = 6;

var model;

function init() {

    // load ML Model 
    loadModel();
    
    // initialize scores
    stats[PLAYER] = {'score': 0, 'completed': 0};
    stats[BOT] = {'score': 0, 'completed': 0};

    generateImgsPath();

    addClassesToSelectBox();

    showHideAnswer(isShow=false);

    showStats();

    // initialize with images
    showNextImgs();
    
    console.log("stats");
    console.log(stats);
    
}

async function loadModel() {
    try {
        model = await tf.loadLayersModel('tfjs_files/model.json');
        console.log(model);
    }
    catch (error) {
        console.log(error);
    }
}



/*** create images path (eg. t_shirt/t_shirt_1.png) for each class ***/
function generateImgsPath() {
    for (var foldKey in classFolderObj) {
        imgsPathObj[foldKey] = [];
        origImgsPathObj[foldKey] = [];
    }

    var totalNumForExperiment = 30;
    while (totalImgs < totalNumForExperiment) {
        var foldKey = Math.floor(Math.random() * 10); // number of classes = 10
        foldKey = foldKey.toString();


        var fileNo = Math.floor(Math.random() * 10) + 1; // number of files for each class = 10

        var filePathStr = classFolderObj[foldKey] + "/" + classFolderObj[foldKey] + "_" + fileNo + FILE_EXTENSION;

        if (imgsPathObj[foldKey].length === 0) {

            imgsPathObj[foldKey].push(filePathStr);
            origImgsPathObj[foldKey].push(filePathStr);
        }
        else {
            // check if the path already exists in the list
            if (imgsPathObj[foldKey].includes(filePathStr)) {
                continue;
            }
            else {
                imgsPathObj[foldKey].push(filePathStr);
                origImgsPathObj[foldKey].push(filePathStr);
            }
        }
        
    
        totalImgs += 1;
    }


    /*
    for (var foldKey in classFolderObj) {
        
        // for testing
        //if (foldKey !== '0' && foldKey !== '1' && foldKey !== '2' && foldKey !== '3') continue;

        

        
        var imgArr = [];
        for (var fileNo=1; fileNo <= NO_OF_IMG_PER_CLASS; fileNo++) {
            var filePathStr = classFolderObj[foldKey] + "/" + classFolderObj[foldKey] + "_" + fileNo + FILE_EXTENSION;
            
            imgArr.push(filePathStr);

            // update total number of images
            totalImgs += 1;
        }
        imgsPathObj[foldKey] = imgArr;
    
    }
    */
    console.log(imgsPathObj);
    console.log(origImgsPathObj);
}

/*** add class name to select box for user to select ***/
function addClassesToSelectBox() {
    var allSelectBoxArr = document.querySelectorAll(".select-class");

    for (var i=0; i < allSelectBoxArr.length; i++) {
        for (var key in classLabelObj) {
            allSelectBoxArr[i].options[allSelectBoxArr[i].options.length] = new Option(classLabelObj[key], key);
        }
    }
}

/*** randomly generate img and remove that path in imgsPathObj. Repeat for n times ***/
function getRandomImages() {
    var randFilesPath = [];
    var randFilesClass = [];


    var counter = 0;
    while (counter < noOfImagesShownEachTime) {
        //var randomClass = Math.floor(Math.random() * 10); 

        var randomClass = Math.floor(Math.random() * 10); 

        var key = randomClass.toString();


        if (imgsPathObj[key].length !== 0) {
            var randomFileIndx = Math.floor(Math.random() * imgsPathObj[key].length);

            randFilesPath.push(imgsPathObj[key][randomFileIndx]);

            randFilesClass.push(key);

            // remove added file path from imgsPathObj to avoid repetition
            imgsPathObj[key].splice(randomFileIndx, 1);

            counter ++;
        }
    }
  
    randImagesClasses = randFilesClass;

    return randFilesPath;
}

/*** show n images ***/
function showImages(randImgPaths) {
    var imgElements = document.getElementsByClassName('actual-image');
    var imagesLoaded = 0;

    enableCheckButton(isToBeEnabled=false);

    for (var i=0; i < imgElements.length; i++) {
        imgElements[i].src = NEW_TEST_IMG_PATH + randImgPaths[i];

        imgElements[i].onload = function(){
            imagesLoaded++;
            if(imagesLoaded === imgElements.length){
                enableCheckButton(isToBeEnabled=true);
            }
        }
        displayHideImgBoundary(isCorrect=null, indx=i);
    }

    var dummyImageElements = document.getElementsByClassName('dummy-small-image');
    for (var i=0; i < dummyImageElements.length; i++) {
        dummyImageElements[i].src = NEW_TEST_IMG_PATH + randImgPaths[i];
    }
}

function enableCheckButton(isToBeEnabled) {
    if (isToBeEnabled) {
        document.getElementById('checkButton').disabled = false;
    }
    else {
        document.getElementById('checkButton').disabled = true;
    }
}

/*** check answers when check button has been clicked ***/
function checkAnswers() {

    var count = 0;
    if (gameTurn === PLAYER) {
        var selectBoxElements = document.getElementsByClassName('select-class');

        
        for (var i=0; i < selectBoxElements.length; i++) {
            var actualAnswer = randImagesClasses[i];
            var userAnswer = selectBoxElements[i].value;

            if (userAnswer === "random") {
                userAnswer = Math.floor(Math.random() * 10).toString();        // ten categories
            }

            if (actualAnswer === userAnswer) {
                count ++;
                displayHideImgBoundary(isCorrect=true, indx=i);

                
            }
            else {
                displayHideImgBoundary(isCorrect=false, indx=i);

                // for testing purpose
                incorrectAnswersImg.push(document.getElementsByClassName('actual-image')[i].src);
            }


            displayAnswer(i, actualAnswer, userAnswer);
            console.log("actual answer: " + actualAnswer);
            console.log("user answer: " + userAnswer);
        }
        console.log("count: " + count);
        
    }
    else {
        // BOT is playing


        var imgElements = document.getElementsByClassName('dummy-small-image');
        

        for (var i=0; i < imgElements.length; i++) {
            var actualAnswer = randImagesClasses[i];
            var botAnswer;


            

            // predict
            //var tensorImg = tf.browser.fromPixels(imgElements[i],1).resizeNearestNeighbor([28, 28]).toFloat().expandDims();
            
        
           
            //var tensorImg = tf.browser.fromPixels(imgElements[i],1).resizeNearestNeighbor([28, 28]).toFloat().div(tf.scalar(255)).expandDims();
            var prediction;

            console.log(tf.browser.fromPixels(imgElements[i],1).asType('float32'));
           
            var tensorImg = tf.browser.fromPixels(imgElements[i],1).asType('float32').resizeBilinear([28, 28]).reshape([1, 28, 28, 1]);
            

            prediction = model.predict(tensorImg).dataSync();
            
            
            //console.log(tensorImg);
            //var prediction = model.predict(tensorImg).dataSync();
            console.log(prediction);

            var largestNumIndx = 0;
            for (var key in prediction) {
                if (prediction[key] > prediction[largestNumIndx]) {
                    largestNumIndx = key;
                }
               
            }
            console.log("category: "+ largestNumIndx);
            botAnswer = largestNumIndx.toString();

            if (actualAnswer === botAnswer) {
                count ++;
                displayHideImgBoundary(isCorrect=true, indx=i);
            }
            else {
                displayHideImgBoundary(isCorrect=false, indx=i);

                 // for testing purpose
                 incorrectAnswersImg.push(document.getElementsByClassName('actual-image')[i].src);
            }


            displayAnswer(i, actualAnswer, botAnswer);
            console.log("actual answer: " + actualAnswer);
            console.log("bot answer: " + botAnswer);
        }
        console.log("count: " + count);
        
    }
    // update the stats
    stats[gameTurn]['score'] += count;
    stats[gameTurn]['completed'] += noOfImagesShownEachTime;  // n images shown each time
    showStats();

    showHideButtons(isNext=true);
    showHideAnswer(isShow=true);

}

/*** show, hide next and check answer buttons depending on status ***/
function showHideButtons(isNext) {

    if (isNext) {
        document.getElementById('nextButton').style.display = "block";
        document.getElementById('checkButton').style.display = "none";
    }
    else {
        document.getElementById('nextButton').style.display = "none";
        document.getElementById('checkButton').style.display = "block";
    }
   
}

/*** when next button (arrow) has been clicked, show  ***/
function showNextImgs() {
    var completed = isCompleted();
    console.log(completed);
    if (completed) {
        next();
        return;
    }


    var randPaths = getRandomImages();


    randImagesPaths = randPaths;
    
    console.log(randImagesPaths);
    
    showImages(randPaths);

    showHideButtons(isNext=false);

    showHideAnswer(isShow = false);

}

/*** show stats ***/
function showStats() {
    document.getElementById('score').innerHTML = `Score: ${stats[gameTurn]['score']}/${totalImgs}`;
    document.getElementById('completed').innerHTML = `Completed: ${stats[gameTurn]['completed']}/${totalImgs}`;
    
    if (gameTurn === PLAYER) {
        document.getElementById('turn').innerHTML = `Turn: Human`;
    }
    else {
        document.getElementById('turn').innerHTML = `Turn: Bot`;
    }
    
}

/*** check if it is time for BOT or to display both results ***/
function isCompleted() {
    return (stats[gameTurn]['completed'] === totalImgs);
}

/*** change turn or game has been finished ***/
function next() {
    if (gameTurn === PLAYER) {
        gameTurn = BOT;

        resetImages();

        // generate same set of images as human
        imgsPathObj = JSON.parse(JSON.stringify(origImgsPathObj));
     
        console.log(imgsPathObj);

        showStats();

        // initialize with images
        showNextImgs();
    }
    else {          // if current game turn is BOT, display results
        alert("Finished");
        document.getElementById('botScore').innerHTML = "Bot score: " + stats[BOT]["score"] + " / " + totalImgs;
        document.getElementById('userScore').innerHTML = "User score: " + stats[PLAYER]["score"] + " / " + totalImgs;
        showResult();


        console.log(incorrectAnswersImg);
    }
}


/*** reset images objects after human has played. ***/
function resetImages() {
    imgsPathObj = {};
    randImagesClasses = [];

    randImagesPaths = [];


    incorrectAnswersImg = [];

}

/*** show red boundary if it is incorrect and green boundary if it is correct ***/
function displayHideImgBoundary(isCorrect, indx) {
    if (isCorrect === null) {
        if (document.getElementsByClassName('actual-image')[indx].className === "actual-image correct") {
            document.getElementsByClassName('actual-image')[indx].className = "actual-image";
        }
        else if (document.getElementsByClassName('actual-image')[indx].className === "actual-image incorrect") {
            document.getElementsByClassName('actual-image')[indx].className = "actual-image";
        }
    

        return;
    }

    if (isCorrect) {
        document.getElementsByClassName('actual-image')[indx].classList.add("correct");
    }
    else {
        document.getElementsByClassName('actual-image')[indx].classList.add("incorrect");
    }
}


/*** display actual and predicted/user answers section ***/
function displayAnswer(indx, actualAnswerKey, userAnswerKey) {

    document.getElementsByClassName("actual-class-label")[indx].innerHTML = "Actual Label: " + classLabelObj[actualAnswerKey];
    
    if (gameTurn === PLAYER) {
        document.getElementsByClassName("choice-label")[indx].innerHTML = "User's choice: " + classLabelObj[userAnswerKey];
    }
    else {
        document.getElementsByClassName("choice-label")[indx].innerHTML = "Bot's choice: " + classLabelObj[userAnswerKey];
    }
    

    document.getElementsByClassName("select-class")[indx].style.display = "none";
    document.getElementsByClassName("answer-cont")[indx].style.display = "block";
}

/*** show or hide selectbox or answer based on whether the user or bot is playing ***/
function showHideAnswer(isShow) {
    
    var selectBoxElementsArr = document.getElementsByClassName("select-class");
    for (var i=0; i < selectBoxElementsArr.length; i++) {
        if (isShow) {
            document.getElementsByClassName("select-class")[i].style.display = "none";

            if (gameTurn === PLAYER) {
                document.getElementsByClassName("answer-cont")[i].style.display = "block";
            }
            else {
                document.getElementsByClassName("answer-cont")[i].style.visibility = "visible";
            }
        }
        else {
            if (gameTurn === PLAYER) {
                document.getElementsByClassName("select-class")[i].style.display = "block";
                document.getElementsByClassName("answer-cont")[i].style.display = "none";
            }
            else {
                document.getElementsByClassName("select-class")[i].style.display = "none";
                document.getElementsByClassName("answer-cont")[i].style.visibility = "hidden";
            }
            
        }
    }
   
}

/*** show player and bot result ***/
function showResult() {
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("resultArea").style.display = "flex";
}

