var https = require('https');
var http = require('http');
var fs = require('fs');


var urlRegexp=/https*:\/\/(.+?)(\/.+)\b/;
var fileRegexp=/.*\/(.+)/;


var _version = "Version 1.3.1, 01/03/24";
var _debug = false;


function FlatplanApp() {
    
    var currentDate = new Date();
    var currentYear = currentDate.getFullYear();
    
    var userPrefs = readPrefsFile();
    if (userPrefs && userPrefs.token && userPrefs.apiUrl && userPrefs.emailId  && userPrefs.clientID) {
      //
    }
    else
    {
        myAlert("Access token, API URL, Email id or client ID are missing, please check flatplan_token.ini file");
       // return;
    }
  
  //userPrefs.emailId

  const [listObj,setListObj] = React.useState({
        fullList:[],
        processedList:{},
        processedListByYear:{},
        processedListByProduct:{},
        maxYear:currentYear, 
        allProducts:["All products"],
        allYears:["All years"],
        key:0
    });

    const [activeScreen, setActiveScreen] = React.useState("Home");
    const [activeYear, setActiveYear] = React.useState(undefined);
    const [activeProduct, setActiveProduct] = React.useState(undefined);
    const [activeMagazineIndex, setActiveMagazineIndex] = React.useState(0);
    const [activePageIndex, setActivePageIndex] = React.useState(0);
    
    const [noteText, setNoteText] = React.useState("");
    const [uploadFilePath, setUploadFilePath] = React.useState(undefined);
    
    
    //eg placeholder
    const [activeAssetId, setActiveAssetId] = React.useState(undefined);
  
    const [activeList,setActiveList] = React.useState([]);
    
    const [magazineJson,setMagazineJson] = React.useState({});
    
    const [pageJson,setPageJson] = React.useState({});
    
    const [showLoader,setShowLoader] = React.useState(false);
    
    const [downloadCounter,setDownloadCounter] = React.useState(0);
    
    const [insertionId, setInsertionId] = React.useState(0);
    
    
    function magazineJsonLoaded(data)
    {
        
        setShowLoader(false);
        
        if(data.error) {
            myAlert("Error: "+data.error);
            return;
        }

        setMagazineJson(data);
        
        setActiveScreen("Magazine");
       
    }
    
    function pageJsonLoaded(data)
    {
        
        setShowLoader(false);
        
        if(data.error) {
            myAlert("Error: "+data.error);
            return;
        }

        var obj = data.content;
        if(obj.List.length)
            obj.key = obj.List[0].PageID;
        else obj.key = 0;
        
     
        
        setPageJson(obj);
        
        setActiveScreen("Page");
       
    }
    
    function buildPlanClick()
    {
        //magazineJson.content.Data
        buildPlan(magazineJson.content.Data,downloadAllImagesCallback);
    }
    
    function downloadAllImagesCallback()
    {

        //download images and place
        //currUrl.url,currUrl.filename,currUrl.insertionId
        /*
        {
                                    "x1": "0.0000",
                                    "y1": "0.0000",
                                    "x2": "594.0000",
                                    "y2": "828.0000",
                                    "tag": "1 and 1 Sports Photo",
                                    "imagepath": "https://mmclientfilessecure.s3.us-west-2.amazonaws.com/Client412/ClientFiles/Digital%20Editions%20(11)_8_t.jpeg?X-Amz-Expires=7200&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIPDW7BVVNCJDLMEQ/20240226/us-west-2/s3/aws4_request&X-Amz-Date=20240226T140922Z&X-Amz-SignedHeaders=host&X-Amz-Signature=8fc1dda5072e0f5abda44a10e5bbc102f94d0b79f17226bb603c2be2bee95956",
                                    "InsertionType": "1",
                                    "AdSizeName": "Full Page",
                                    "Notes": "here is the ad",
                                    "OrderID": "25061",
                                    "FileName": "Digital Editions (11)_8_t.jpeg"
                                }
                                */
        var data = magazineJson.content.Data;   
                            
        var urlArray = [];
        var pagesData = data.Page;
        for(var i=0;i<pagesData.length;i++) {
            var currPage = pagesData[i];
            if(!currPage.Element || !currPage.Element.length) continue;
            for(var j=0;j<currPage.Element.length;j++) {
                var currElem = currPage.Element[j];
                if(!currElem.imagepath || !currElem.FileName) continue;
                var newUrl = {
                    url:currElem.imagepath,
                    insertionId:currElem.OrderID,
                    filename:currElem.FileName
                };
                urlArray.push(newUrl);
            }
        }
        
 
        if(urlArray.length)
            downloadImages(urlArray);
    }
    
    function uploadImageClick()
    {
         setShowLoader(true);
         
    }
    
    function imageUploaded()
    {
        setShowLoader(false);
        backToPageDetails();
    }
    
    function imageDownloadedPlaceCallback(result)
    {
        
        //myAlert("image downloaded callback "+result.insertionId);
        decreaseDownloadCounter();
        if(result.error)
        {
            myAlert(result.error)
        }
        
        placeImages([{
            insertionId:result.insertionId,
            filePath:result.filePath
        }]);
    }
    
    //we use this for single image too, pass as 1 element array
    function downloadImages(urlArray)
    {
        //browse to folder
        if(!urlArray || !urlArray.length) {
            myAlert("No files to download");
            return;
        }
        
        var mySaveFolder = chooseFolder();
        if(!mySaveFolder) return;
        

         setDownloadCounter(urlArray.length);
         setShowLoader(true);
         
         for(var i=0;i<urlArray.length;i++)
         try{
             let currUrl = urlArray[i];
             if(!currUrl)
             {
                 decreaseDownloadCounter();
                 continue;
             }

             
             downloadFile(currUrl.url,currUrl.filename,currUrl.insertionId,mySaveFolder,imageDownloadedPlaceCallback);
         }catch(e){myAlert(e+":"+e.line);decreaseDownloadCounter(); }
         
    }
    

    
    function decreaseDownloadCounter()
    {
        let currCounter = downloadCounter-1;
        setDownloadCounter(currCounter);  
        if(currCounter<=0) setShowLoader(false);

    }
    
  function updateActiveMagazineIndex(index) {
    
      setActiveMagazineIndex(index);
      setShowLoader(true);
      loadLayoutJson(userPrefs.token,userPrefs.apiUrl,userPrefs.clientID,activeList[index],magazineJsonLoaded);
      
  
  }
  
  function updateActivePageIndex(index) {
      setActivePageIndex(index);
      setShowLoader(true);
      loadPageJson(userPrefs.token,userPrefs.apiUrl,userPrefs.clientID,magazineJson.content.Data.Page[index].id,pageJsonLoaded);
  }
  
  
  function uploadAssetFile(filePath) {
      
  }

  function uploadCallback(resultObj)
  {
      
  }
  
  function back() {
    setActiveScreen("Home");
  }

  function backToMagazine() {
    setActiveScreen("Magazine");
  }
  
  function uploadClicked(insertionId) {
      setInsertionId(insertionId);
    setActiveScreen("UploadNote");
  }
  
  function backToPageDetails() {
    setActiveScreen("Page");
  }
  
  function updateActiveYear(e) {
    var currYear = e.target.value;
    setActiveYear(currYear);
    updateActiveList(currYear, activeProduct);
  }

  function updateActiveProduct(e) {
    var currProduct = e.target.value;
    setActiveProduct(currProduct);
    updateActiveList(activeYear, currProduct);
  }

  function updateActiveList(year, product) {
    if (year == "All years" && product == "All products") {
      setActiveList(listObj.fullList);
      return;
    }

    if (year == "All years") {
      if (listObj.processedListByProduct[product]) setActiveList(listObj.processedListByProduct[product]);else setActiveList([]);
      return;
    }

    if (product == "All products") {
      if (listObj.processedListByYear[year]) setActiveList(listObj.processedListByYear[year]);else setActiveList([]);
      return;
    }

    if (listObj.processedList[product][year]) setActiveList(listObj.processedList[product][year]);else setActiveList([]);
  }


  
  
  function listLoaded(data)
  {
      setShowLoader(false);
      
      if(data.error) {
          myAlert("Error: "+data.error);
          return;
      }
      
      setListObj(data);
      setActiveYear("All years");
      setActiveProduct("All products");
      setActiveList(data.fullList);
  }
  
  React.useEffect(() => {
        // code to run on component mount
      setShowLoader(true);
      getListObj(userPrefs.token,userPrefs.apiUrl,listLoaded);
  }, []);
  
  
  return React.createElement("div", {
    className: "App"
  }, 
      showLoader ? React.createElement(Loader) : null,
  
      React.createElement(Header, null), 
    activeScreen == "Home" ? React.createElement(Dropdown, {
    className: "SelectYear",
    options: listObj.allYears,
    selected: activeYear,
    update: updateActiveYear
  }) : null, 
  
  activeScreen == "Home" ? React.createElement(Dropdown, {
    className: "SelectProduct",
    options: listObj.allProducts,
    selected: activeProduct,
    update: updateActiveProduct
  }) : null, 
  
     activeScreen == "Home" ? React.createElement(Home, {
    list: activeList,
    select: updateActiveMagazineIndex
  }) : null, 
  
    activeScreen == "Magazine" ? React.createElement(Magazine, {
    pubData: activeList[activeMagazineIndex],
    fullData: magazineJson,
    back: back,
    buildPlan: buildPlanClick,
    selectPage: updateActivePageIndex
  }): null,
  
  activeScreen == "Page" ? React.createElement(PageDetail, {
      pubData: activeList[activeMagazineIndex],
      pageData: magazineJson.content.Data.Page[activePageIndex],
      notesData: pageJson,
      uploadClicked: uploadClicked, 
      downloadImages: downloadImages,
      back: backToMagazine
}): null, 

  activeScreen == "UploadNote" ? React.createElement(Note, {
      pubData: activeList[activeMagazineIndex],
      pageData: magazineJson.content.Data.Page[activePageIndex],
      notesData: pageJson,
      back: backToPageDetails,
      userPrefs: userPrefs,
      insertionId: insertionId
}): null

);
}

function Loader() {

  return React.createElement("div", {
    className: "loader"
  },
  React.createElement("p",{},"Loading...")
  );
}

function Dropdown(props) {
  var options = props.options.map(function (obj) {
    return React.createElement("option", {
      value: obj
    }, obj);
  });
  return React.createElement("select", {
    className: props.className,
    value: props.selected,
    onChange: props.update
  }, options);
}


function Header() {
  function exitPanel() {
      var csInterface = new CSInterface();
      csInterface.closeExtension();
  }

  return React.createElement("div", {
    className: "Header"
  }, React.createElement("div", {
    id: "Light_Tabs_Fixed_3_States",
    className: "Light____Tabs__Fixed___3_States_"
  }, React.createElement("div", {
    id: "Light_TabsElementsContainer",
    className: "Light____Tabs__Elements_Container"
  }, React.createElement("div", {
    id: "Light_Elevation00dp_r",
    className: "Light____Elevation_00dp"
  }, React.createElement("div", {
    id: "Shadow_s"
  }, React.createElement("svg", {
    className: "Rectangle_v"
  }, React.createElement("rect", {
    id: "Rectangle_v",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "428",
    height: "53"
  })), React.createElement("svg", {
    className: "Rectangle_v"
  }, React.createElement("rect", {
    id: "Rectangle_v",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "428",
    height: "53"
  })), React.createElement("svg", {
    className: "Rectangle_v"
  }, React.createElement("rect", {
    id: "Rectangle_v",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "428",
    height: "53"
  })))), React.createElement("svg", {
    className: "Primary_w"
  }, React.createElement("rect", {
    id: "Primary_w",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "428",
    height: "53"
  })), React.createElement("div", {
    id: "Light_Elevation00dp_r",
    className: "Light____Elevation_00dp"
  }, React.createElement("div", {
    id: "Shadow_s"
  }, React.createElement("svg", {
    className: "Rectangle_v"
  }, React.createElement("rect", {
    id: "Rectangle_v",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "428",
    height: "53"
  })), React.createElement("svg", {
    className: "Rectangle_v"
  }, React.createElement("rect", {
    id: "Rectangle_v",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "428",
    height: "53"
  })), React.createElement("svg", {
    className: "Rectangle_v"
  }, React.createElement("rect", {
    id: "Rectangle_v",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "428",
    height: "53"
  })))), React.createElement("svg", {
    className: "Primary_w"
  }, React.createElement("rect", {
    id: "Primary_w",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "428",
    height: "53"
  })))), React.createElement("img", {
    id: "Image_1",
    src: "images/Image_1.png"
  }), React.createElement("div", {
    id: "iconnavigationclose_24px",
    className: "icon_navigation_close_24px",
    onClick: function onClick() {
      return exitPanel();
    }
  }, React.createElement("svg", {
    className: "Boundary"
  }, React.createElement("rect", {
    id: "Boundary",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "35",
    height: "35"
  })), React.createElement("svg", {
    className: "n_Color",
    viewBox: "0 0 25 25"
  }, React.createElement("path", {
    id: "n_Color",
    d: "M 25 2.51785683631897 L 22.48214149475098 0 L 12.5 9.982142448425293 L 2.51785683631897 0 L 0 2.51785683631897 L 9.982142448425293 12.5 L 0 22.48214149475098 L 2.51785683631897 25 L 12.5 15.01785564422607 L 22.48214149475098 25 L 25 22.48214149475098 L 15.01785564422607 12.5 L 25 2.51785683631897 Z"
  }))), React.createElement("svg", {
    className: "Boundary_"
  }, React.createElement("rect", {
    id: "Boundary_",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "34",
    height: "34"
  })));
}


function Home(props) {

  var allIssues = props.list.map(function (obj, index) {
    return React.createElement(MagazineCard, {
      PubName: obj.PubName,
      Thumb: obj.ThumbnailImageUrl,
      IssueName: obj.IssueName,
      IssueYear: obj.IssueYear,
      MagazineIndex: index,
      key: obj.IssueID,
      select: props.select,
        selectPage:props.selectPage
    });
  }); //if()

  return React.createElement("div", {
    className: "Home"
  }, allIssues);
}


function Magazine(props) {
    
  var magData = props.fullData.content.Data.Page.sort(function (a, b) {
    return Number(a.PgOrder) > Number(b.PgOrder) ? 1 : -1;
  });
  
  
  var allThumbs = magData.map(function (obj, index) {
    return React.createElement(PageCard, {
      pageIndex: index,
      pageOrder: obj.PgOrder,
      Thumb: obj.ThumbnailImageUrl.replace(/\\/g, "/"),
      select: props.selectPage
    });
  });
  
  return React.createElement(React.Fragment, null, React.createElement("div", {
    id: "Group_4"
  }, React.createElement("div", {
    id: "n_Subtitle_1_c"
  }, React.createElement("span", null, props.pubData.PubName)), React.createElement("div", {
    id: "Secondary_text_c"
  }, React.createElement("span", null, props.pubData.IssueName, " ", props.pubData.IssueYear)), React.createElement("svg", {
    className: "n_Color_bh",
    viewBox: "0 0 18.102 30.32",
    onClick: props.back
  }, React.createElement("path", {
    id: "n_Color_bh",
    d: "M 3.444584369659424 0 L 0 3.562630414962769 L 11.18879222869873 15.16012954711914 L 0 26.75762939453125 L 3.444584369659424 30.32025909423828 L 18.10239028930664 15.16012954711914 L 3.444584369659424 0 Z"
  })), React.createElement("button", {
    id: "import-button",
    onClick: function onClick() {
        return props.buildPlan();
      }
  }, "IMPORT")), React.createElement("div", {
    className: "Magazine"
  }, allThumbs));
}


function MagazineCard(props) {


  return React.createElement("div", {
    className: "MagazineCard"
  }, React.createElement("div", {
    id: "List_items"
  }, React.createElement("div", {
    id: "Devider__Light__d",
    className: "Devider___Light___"
  }, React.createElement("svg", {
    className: "Devider__Light__ea"
  }, React.createElement("rect", {
    id: "Devider__Light__ea",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "273",
    height: "1"
  }))), React.createElement("div", {
    id: "n_Subtitle_1_d"
  }, React.createElement("span", null, props.PubName)), React.createElement("div", {
    id: "Secondary_text_d"
  }, React.createElement("span", null, props.IssueName, " ", props.IssueYear)), React.createElement("div", {
    id: "n_Light__CardElements_ImageAIm_d",
    className: "_Light_____Card__Elements____Image_A_Image"
  }, React.createElement("img", {
    id: "n_aa2afb239aa663c77ff68709b1fa_d",
    width: "61",
    height: "72",
    src: props.Thumb
  })), React.createElement("div", {
    id: "n_Choose_to_use_Icon_eb",
    className: "___Choose_to_use___Icon"
  }, React.createElement("svg", {
    className: "Boundary_ec"
  }, React.createElement("rect", {
    id: "Boundary_ec",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "0",
    height: "0"
  })), React.createElement("svg", {
    className: "n_Color_ed",
    viewBox: "0 0 0 18"
  }, React.createElement("path", {
    id: "n_Color_ed",
    d: "M 8.571432772441767e-06 0 L 1.428572090844682e-06 0 C 6.428574010897137e-07 0 0 0.8999999761581421 0 2 L 0 18 L 5.00000214742613e-06 15 L 1.000000429485226e-05 18 L 1.000000429485226e-05 2 C 1.000000429485226e-05 0.8999999761581421 9.357147064292803e-06 0 8.571432772441767e-06 0 Z"
  }))), React.createElement("div", {
    id: "iconnavigationchevron_right_24_ee",
    className: "icon_navigation_chevron_right_24px",
    onClick: function onClick() {
      return props.select(props.MagazineIndex);
    }
  }, React.createElement("svg", {
    className: "Boundary_ef"
  }, React.createElement("rect", {
    id: "Boundary_ef",
    rx: "0",
    ry: "0",
    x: "0",
    y: "0",
    width: "63",
    height: "63"
  })), React.createElement("svg", {
    className: "n_Color_eg",
    viewBox: "0 0 18.102 30.32"
  }, React.createElement("path", {
    id: "n_Color_eg",
    d: "M 3.444584369659424 0 L 0 3.562630414962769 L 11.18879222869873 15.16012954711914 L 0 26.75762939453125 L 3.444584369659424 30.32025909423828 L 18.10239028930664 15.16012954711914 L 3.444584369659424 0 Z"
  })))));
}


function PageCard(props) {
  var className = props.pageIndex == 0 ? "PageCardCover" : "PageCard";
  return React.createElement("div", {
    className: className,
      onClick: function onClick() {
        return props.select(props.pageIndex);
      }
  }, React.createElement("img", {
    src: props.Thumb,
    width: "98",
    height: "124"
  }), React.createElement("p", null, props.pageOrder));
}

function PlaceholderCard(props)
{
    var className = "PlaceholderCard";
    
    function downloadClicked()
    {
         props.downloadImages([{url:props.ImageUrl,filename:props.FileName,insertionId:props.insertionId}]);
    }
    
    function uploadClicked()
    {
         props.uploadClicked(props.insertionId);
    }
    
    return React.createElement("div", {
      className: className
       // onClick: function onClick() {
    //      return props.select(props.pageIndex);
      //  }
    }, React.createElement("img", {
      src: props.thumbnailUrl,
      className: "placeholder-card-image",
      width: "98",
      height: "124"
    }), 
    React.createElement("p", {className:"placeholder-insertion-id"}, "#"+props.insertionId),
    React.createElement("p", {className:"placeholder-tag"}, props.tag),
    React.createElement("p", {className:"placeholder-ad-size"}, props.AdSize),
    React.createElement("div", {
      className: "ul-button",
      onClick: uploadClicked
    },
    React.createElement("svg", {
        className: "Path_13",
        viewBox: "0 0 27.273 30.612"
    }, React.createElement("path", {
        id: "Path_13",
        d:"M 0 0 L 27.2729320526123 0 L 27.2729320526123 30.61247634887695 L 0 30.61247634887695 L 0 0 Z"
    })),
    React.createElement("svg", {
        className: "Path_14",
        viewBox: "5 3 21.707 26.716"
    }, React.createElement("path", {
        id: "Path_14",
        d:"M 11.2020092010498 23.43014144897461 L 20.5050220489502 23.43014144897461 L 20.5050220489502 14.00084686279297 L 26.70702934265137 14.00084686279297 L 15.853515625 3.000000476837158 L 5 14.00084686279297 L 11.2020092010498 14.00084686279297 L 11.2020092010498 23.43014144897461 Z M 5 26.57324600219727 L 26.70702934265137 26.57324600219727 L 26.70702934265137 29.71634292602539 L 5 29.71634292602539 L 5 26.57324600219727 Z"
    }))
    ),
    React.createElement("div", {
      className: "dl-button",
        onClick: downloadClicked
    },
    React.createElement("svg", {
        className: "Path_15_dt",
        viewBox: "5 3 22.167 26.917"
    }, React.createElement("path", {
        id: "Path_15_dt",
        d:"M 5.000000476837158 29.91666793823242 L 27.16666984558105 29.91666793823242 L 27.16666984558105 26.75 L 5.000000476837158 26.75 L 5.000000476837158 29.91666793823242 Z M 27.16666984558105 12.5 L 20.83333396911621 12.5 L 20.83333396911621 2.999999761581421 L 11.33333301544189 2.999999761581421 L 11.33333301544189 12.5 L 5.000000476837158 12.5 L 16.08333396911621 23.58333396911621 L 27.16666984558105 12.5 Z"
    })))
    );
}



function PageDetail(props)
{
   
    
    function downloadAllImages()
    {
        let allPhData = props.notesData.List;
        var allImages =  allPhData.map(function (obj, index) {
            return {url:obj.ImageUrl,filename:obj.FileName,insertionId:obj.InsertionId}
          })
          props.downloadImages(allImages);
    }
        
    let allPhData = props.notesData.List;
    
    var allPlaceholders = allPhData.map(function (obj, index) {
      return React.createElement(PlaceholderCard, {
          elementIndex: index,
          tag:obj.tag,
          thumbnailUrl:obj.thumbnailIUrl,
          insertionId:obj.InsertionId,
          AdSize:obj.AdSize,
          FileName: obj.FileName,
          ImageUrl:obj.ImageUrl, 
          uploadClicked: props.uploadClicked,
          downloadImages: props.downloadImages
      });
    });
 
    return React.createElement(React.Fragment, null, React.createElement("div", {
      id: "Group_4"
    }, React.createElement("div", {
      id: "page-details-page-name"
    }, React.createElement("span", null, "Page "+props.pageData.PgOrder)), 
    React.createElement("div", {
      id: "page-details-pub-name"
    }, React.createElement("span", null, props.pubData.PubName)), 
    React.createElement("div", {
      id: "page-details-issue-name"
    }, React.createElement("span", null, props.pubData.IssueName, " ", props.pubData.IssueYear)), 
    React.createElement("svg", {
      className: "n_Color_bh",
      viewBox: "0 0 18.102 30.32",
      onClick: props.back
    }, React.createElement("path", {
      id: "n_Color_bh",
      d: "M 3.444584369659424 0 L 0 3.562630414962769 L 11.18879222869873 15.16012954711914 L 0 26.75762939453125 L 3.444584369659424 30.32025909423828 L 18.10239028930664 15.16012954711914 L 3.444584369659424 0 Z"
    })), 
    allPlaceholders.length !=0 ? React.createElement("div", {
      className: "dl-all-button"
    },
    React.createElement("svg", {
        className: "Path_15",
        viewBox: "5 3 28.583 34.708",
        onClick: downloadAllImages
    }, React.createElement("path", {
        id: "Path_15",
        d:"M 5.000000476837158 37.70833587646484 L 33.58333587646484 37.70833587646484 L 33.58333587646484 33.625 L 5.000000476837158 33.625 L 5.000000476837158 37.70833587646484 Z M 33.58333587646484 15.25 L 25.41666793823242 15.25 L 25.41666793823242 3 L 13.16666603088379 3 L 13.16666603088379 15.25 L 5.000000476837158 15.25 L 19.29166603088379 29.54166793823242 L 33.58333587646484 15.25 Z"
    }))) : null,
    React.createElement("div", {
      className: "PageDetail"
    }, allPlaceholders)));
} 


function Note(props)
{
    
    
    const [noteText, setNoteText] = React.useState("");
    const [filePath, setFilePath] = React.useState("");
    const [fileName, setFileName] = React.useState("");
    const [finalImage, setFinalImage] = React.useState("checked");
    
    function uploadClicked()
    {
       
        //browse
        var myFilePath = chooseFile();
        if(myFilePath)
        {
            setFilePath(myFilePath);
            var nameData = myFilePath.split("/");
            var myFileName = nameData[nameData.length-1];
            setFileName(myFileName);
        }
    }
    
    function saveClicked()
    {
        if(!filePath) {
            myAlert("No file selected!");
            return;
        }
        
        
        //upload
        try{            
        uploadNoteFile(props.userPrefs.token, props.userPrefs.apiUrl, props.insertionId, noteText, fileName, filePath, props.userPrefs.clientID, props.userPrefs.emailId, uploadCallback);
        }catch(e){myAlert(e+":"+e.line)}
    }
    
    function uploadCallback(resp)
    {
        //check status
        //020224
        /*
        
        {"hostname":"salesdemo.magazinemanager.com","port":443,"method":"POST","path":"/services/InDesign/ProductionNote/Add/","headers":{"Content-Type":"application/json","Content-Length":427531,"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJMb2dnZWRJblVzZXJJRCI6IjAiLCJMb2dnZWRJblNpdGVDbGllbnRJRCI6IjQxMiIsIkxvZ2dlZEluU2l0ZUN1bHR1cmVVSSI6ImVuLVVTIiwiRGF0ZVRpbWUiOiI4LzUvMjAyMiAyOjU2OjAzIFBNIiwiTG9nZ2VkSW5TaXRlQ3VycmVuY3lTeW1ib2wiOiIiLCJMb2dnZWRJblNpdGVEYXRlRm9ybWF0IjoiIiwiRG9tYWluIjoic2FsZXNkZW1vIiwiTG9nZ2VkSW5TaXRlVGltZUFkZCI6WyIwIiwiMCJdLCJTb3VyY2UiOiJNQ1AiLCJFbWFpbCI6Impha29ibGZlbmdlckBnbWFpbC5jb20iLCJJc0FQSVVzZXIiOiJUcnVlIiwibmJmIjoxNjU5NzExMzYzLCJleHAiOjE4MTUyMzEzNjMsImlhdCI6MTY1OTcxMTM2MywiaXNzIjoiTWFnYXppbmVNYW5hZ2VyIiwiYXVkIjoiKiJ9.rJ3mqEsIsEFR6zfMrAIvMN-oo--mReni10E0AliIuvA"}}
        
        {"Note":"upload test ET 020224","OrderID":201737,"Creator":{"ID":"jakoblfenger@gmail.com"},"IsCustomerPortal":false,"Internal":false,"NoteType":"FILE","IsApprovalRequired":false,"Final":true,"File":{"name":"!@#$%^.jpg","FileUploadSource":9,"ClientID":"jakoblfenger@gmail.com","fileStreamData":"
        
        
        {"responseHeader":null,"content":{"Status":"Success","List":null,"Data":{"ID":3150,"OrderID":201737,"TaskID":-1,"Note":"note et 2024 test","OriginalNote":null,"CreateDate":"2024-02-02T11:27:06.173","Creator":{"ID":0,"FirstName":"*Unassigned*","LastName":"","Name":"*Unassigned*","Color":null,"Email":null,"HostURL":null,"CopyUserID":0,"UserRole":null},"FilePath":"Clientjakoblfenger@gmail.com/ClientFiles/!%40%23$%25%5E.jpg","Internal":false,"Final":true,"IsCustomerPortal":false,"ClientAddress":null,"FileName":null,"Extension":null,"Source":"MM","File":{"name":"Clientjakoblfenger@gmail.com/ClientFiles/!%40%23$%25%5E.jpg","Height":null,"Width":null,"X":null,"Y":null,"fileStreamData":null,"stream":null,"FileContent":null,"FileUploadSource":0,"FolderPath":null,"ClientID":null,"FileSavedInfo":null,"IsContract":false,"OrderId":0,"ProposalId":0,"Size":0,"Type":".jpg","IsProdNoteThumbnail":false},"NoteType":"FILE","StageID":0,"ApprStatus":0,"IsApprovalRequired":false,"ParentId":null,"ProductionContact":{"ID":0,"Name":"","FirstName":null,"MiddleName":null,"LastName":null,"SalesRepID":0,"ContactName":"","ContactFullName":"","FullNameWithCompany":"","IsDefault":false,"Phone":null,"PhoneExt":null,"Email":"","CellPhone":null,"InActive":false},"FromEmail":"","ToEmail":"","FromName":null,"Subject":null,"HtmlBody":null,"LetterTemplateId":0,"FromToNote":null,"IsReminder":false,"WorkflowIds":null,"PortalQuerystring":"","RepEmail":null,"CcEmails":""},"Value":0}}
        */
        
        
        /*
        {"responseHeader":null,"content":{"Status":"Success","List":null,"Data":{"ID":10555,"OrderID":201737,"TaskID":-1,"Note":"","OriginalNote":null,"CreateDate":"2023-11-28T17:55:14.737","Creator":{"ID":0,"FirstName":"*Unassigned*","LastName":"","Name":"*Unassigned*","Email":null,"HostURL":null,"CopyUserID":0},"FilePath":"Clientiriley@mirabeltechnologies.com/ClientFiles/!@#$%^.jpg","Internal":false,"Final":true,"IsCustomerPortal":false,"ClientAddress":null,"FileName":null,"Extension":null,"Source":"MM","File":{"name":"Clientiriley@mirabeltechnologies.com/ClientFiles/!@#$%^.jpg","Height":null,"Width":null,"X":null,"Y":null,"fileStreamData":null,"stream":null,"FileContent":null,"FileUploadSource":0,"FolderPath":null,"ClientID":null,"FileSavedInfo":null,"IsContract":false,"OrderId":0,"ProposalId":0,"Size":0.00,"Type":".jpg","IsProdNoteThumbnail":false},"NoteType":"FILE","StageID":0,"ApprStatus":0,"IsApprovalRequired":false,"ParentId":null,"ProductionContact":{"ID":0,"Name":"","FirstName":null,"MiddleName":null,"LastName":null,"SalesRepID":0,"ContactName":"","ContactFullName":"","FullNameWithCompany":"","IsDefault":false,"Phone":null,"PhoneExt":null,"Email":"","CellPhone":null,"InActive":false},"FromEmail":"","ToEmail":"","FromName":null,"Subject":null,"HtmlBody":null,"LetterTemplateId":0,"FromToNote":null,"IsReminder":false,"WorkflowIds":null,"PortalQuerystring":"","RepEmail":null,"CcEmails":""},"Value":0}}
        */
 
        
        if(resp.error){
            myAlert(resp.error);
            return;
        }
        
       // alert(JSON.stringify(resp.body));
        
        if(resp.body && resp.body.content) {
            if (resp.body.content.Status=="Success")
            {
                myAlert("Uploaded succesfully");
                props.back();
            }
            else myAlert("Upload error, status returned: "+resp.body.content.Status)
            }
        else myAlert("Upload error")
        

    }
    
    return React.createElement(React.Fragment, null, React.createElement("div", {
      id: "Group_4"
    }, React.createElement("div", {
      id: "page-details-page-name"
    }, React.createElement("span", null, "Page "+props.pageData.PgOrder)), 
    React.createElement("div", {
      id: "page-details-pub-name"
    }, React.createElement("span", null, props.pubData.PubName)), 
    React.createElement("div", {
      id: "page-details-issue-name"
    }, React.createElement("span", null, props.pubData.IssueName, " ", props.pubData.IssueYear)), 
    React.createElement("svg", {
      className: "n_Color_bh",
      viewBox: "0 0 18.102 30.32",
      onClick: props.back
    }, React.createElement("path", {
      id: "n_Color_bh",
      d: "M 3.444584369659424 0 L 0 3.562630414962769 L 11.18879222869873 15.16012954711914 L 0 26.75762939453125 L 3.444584369659424 30.32025909423828 L 18.10239028930664 15.16012954711914 L 3.444584369659424 0 Z"
    })), 
    React.createElement("div", {
      className: "Note"
    }, 
    React.createElement("p", {
        className: "note-caption"
    }, "Note Description"),
    React.createElement("textarea", {
      name: "noteDescription",
        className: "note-description",    
      rows: 4,
      cols: 40,
        value: noteText,
      onChange: e => setNoteText(e.target.value)
    }),
    React.createElement("input", {  
        type: "checkbox",
        checked: finalImage,
        className: "final-cb",
        onClick: e => setFinalImage("checked")
    }),
    React.createElement("p", {
        className: "final-cb-caption"
    }, "Final Image"),
    React.createElement("p", {
        className: "upload-file-caption"
    }, "Upload File"),
    React.createElement("input", {  
        readOnly: true,
        className: "filepath-input",
        value: fileName 
    }),
    React.createElement("button",{
        onClick:uploadClicked,
        className: "upload-file-button"
    },"Upload File"), 
    React.createElement("button",{
        onClick:saveClicked,
        className: "save-button"
    },"Save")    
    )));
} 


function buildPlan(jsonData,callback)
{   
    evalScript("buildPlan(\""+encodeURIComponent(JSON.stringify(jsonData))+"\");",callback);
}

function placeImages(jsonData) 
{
     evalScript("placeImages(\""+encodeURIComponent(JSON.stringify(jsonData))+"\");");   
}

function myAlert(msg)
{
  evalScript("myAlert(\""+msg+"\");");  
}


function uploadNoteFile(token, baseUrl, insertionId, noteText, fileName, filePath, clientId, emailId, callback)
{
    
  
    
    //URL: https://tier1-dev20.magazinemanager.com/services/InDesign/ProductionNote/Add/ 

    //Method Type: POST
    
    //fileStreamData: image need to cnvert to the base64 Bytes,
    
    var fileData = readFileBase64(filePath);
    if(!fileData)
    {
        myAlert("error reading file "+filePath);
        callback({err: "error reading file "+filePath});
        return;
    }
    
    var jsonData = 
        {
        "Note": noteText,
        "OrderID":insertionId,
        "Creator":{"ID":emailId},
        "IsCustomerPortal":false,
        "Internal":false,
        "NoteType": "FILE",
         "IsApprovalRequired":false,
         "Final":true,
        "File":{
         "name": fileName,
         "FileUploadSource":9,
         "ClientID":clientId,
         "fileStreamData":fileData
         }
     };
     
     var jsonStr = JSON.stringify(jsonData);
     
     var options = {
         hostname: baseUrl,
         port: 443,
         method: 'POST',
         path: "/services/InDesign/ProductionNote/Add/",
         headers: {
             'Content-Type': 'application/json',
             'Content-Length': Buffer.byteLength(jsonStr), 
             'Authorization': 'Bearer '+token
         }
     };
     
     var uploadRequest = https.request(options, function(response) {

         var body = "";

         response.on('error', function(err) {

             callback({
                 error: err
             })
         });

         response.on('data', function(chunk) {
             body += chunk;

         });

         response.on('end', function() {
             var error = false;
  
             try {
                 body = JSON.parse(body);
             } catch (e) {
                 error = "Error: couldn't parse response body";
             }

             callback({
                 error: error,
                 body: body,
                 response: response
             })

         });

     });
     
     uploadRequest.setTimeout(1000*10, function() {
         uploadRequest.abort();
         callback({error:"Timeout error"});
     });
    
     uploadRequest.on('error', function() {
                 callback({error:"upload error"});
             });

     uploadRequest.write(jsonStr);

     uploadRequest.end();

}

function loadPageJson(token,baseUrl,clientId,pageId,callback)
{
//http://tier1-dev20.magazinemanager.com/services/Indesign/NotesWithImages/{PageID}/{ClientID} 
//https://tsqb.magazinemanager.com/services/InDesign/PageDetails/BEE22555-F307-4E82-BF04-C7B94ABBF3EA/1027
var options = {
    hostname: baseUrl,
    port: 443,
    method: 'GET',
    path: "/services/Indesign/PageDetails/"+pageId+"/"+clientId,
    headers: {
          'Content-Type': 'application/json',
        'Authorization': 'Bearer '+token
        }
};

var myRequest = https.request(options, function(response) {
    var body = "";

    response.on('data', function(chunk) {
        body += chunk;

    });

    response.on('end', function() {
       callback(getProcessedPageDetails(body));
    });

    response.on('error', function() {
        callback({error:"Error"});
    });
})
myRequest.on('error', function() {
        callback({error:"Error"});
    });
    
myRequest.setTimeout(1000*10, function() {
    myRequest.abort();
    callback({error:"Error"});
});

myRequest.end();
   
}

function getListObj(token,baseUrl,callback)
{
//    https://tier1-dev20.magazinemanager.com/services/Indesign/Flatplanlist
//https://tier1-dev20.magazinemanager.com/services/Indesign/Flatplan/574/5126/2021
//ProductID=574
//IssueID=5126
//IssueYear=2021

var options = {
    hostname: baseUrl,
    port: 443,
    method: 'GET',
    path: "/services/Indesign/Flatplanlist",
    headers: {
          'Content-Type': 'application/json',
        'Authorization': 'Bearer '+token
        }
};

var myRequest = https.request(options, function(response) {
    var body = "";

    response.on('data', function(chunk) {
        body += chunk;

    });

    response.on('end', function() {
        callback(getProcessedList(body));
    });

    response.on('error', function() {
        callback({error:"Error"});
    });
})
myRequest.on('error', function() {
        callback({error:"Error"});
    });
    
myRequest.setTimeout(1000*10, function() {
    myRequest.abort();
    callback({error:"Error"});
});

myRequest.end();
}


function loadLayoutJson(token,baseUrl,clientId,jsonData,callback)
{
    //    https://tier1-dev20.magazinemanager.com/services/Indesign/Flatplanlist
    //https://tier1-dev20.magazinemanager.com/services/Indesign/Flatplan/574/5126/2021
    //ProductID=574
    //IssueID=5126
    //IssueYear=2021

    var options = {
        hostname: baseUrl,
        port: 443,
        method: 'GET',
        path: "/services/Indesign/Flatplan/"+jsonData.ProductID+"/"+jsonData.IssuID+"/"+jsonData.IssueYear+"/"+clientId,
        headers: {
              'Content-Type': 'application/json',
            'Authorization': 'Bearer '+token
            }
    };
  
    
    var myRequest = https.request(options, function(response) {
        var body = "";

        response.on('data', function(chunk) {
            body += chunk;

        });

        response.on('end', function() {
  
            callback(getProcessedLayout(body));
        });

        response.on('error', function() {
            callback({error:"Error"});
        });
    })
    myRequest.on('error', function() {
            callback({error:"Error"});
        });
    
    myRequest.setTimeout(1000*10, function() {
        myRequest.abort();
        callback({error:"Error"});
    });

    myRequest.end();
}


function evalScript(script, callback) {
    var csInterface = new CSInterface();
    csInterface.evalScript("$._ext_" + csInterface.hostEnvironment.appName + "." + script, callback);
 
}



function readPrefsFile() {
    var prefsObj = {};
    var csInterface = new CSInterface();
    var prefsFile = csInterface.getSystemPath(SystemPath.MY_DOCUMENTS);
   
    var prefsPath = prefsFile + "/flatplan_token.ini";
    

    result = window.cep.fs.readFile(prefsPath);

    if (window.cep.fs.ERR_NOT_FOUND == result.err)
    {
        myAlert(prefsPath+" is missing!");
        return prefsObj;
    }

    try {
        if (result.err == window.cep.fs.NO_ERROR && result.data) {
            prefsObj = JSON.parse(result.data);
        }

    } catch (e) {myAlert(e+":"+e.line)}

    return prefsObj;
}


//not used currently
function savePrefs(prefsObject) {
    var csInterface = new CSInterface();
    var prefsFile = csInterface.getSystemPath(SystemPath.USER_DATA);
    prefsFile += "/LocalStore";

    var result = window.cep.fs.readdir(prefsFile);
    if (window.cep.fs.ERR_NOT_FOUND == result.err)
        window.cep.fs.makedir(prefsFile);

    var prefsPath = prefsFile + "/flatplan.json";

    window.cep.fs.writeFile(prefsPath, JSON.stringify(prefsObject));
}

function urlClick(url) {
    var csInterface = new CSInterface();
    csInterface.openURLInDefaultBrowser("http://" + url);
}

function readFileBase64(path)
{
    var result = window.cep.fs.readFile(path, cep.encoding.Base64);
    if(result.err === 0){
      //success
      return result.data;
  }
  else return undefined;
}

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

function chooseFolder(){
    var result = window.cep.fs.showOpenDialogEx(false, true, "Please choose folder");
    var targetFolder = undefined;
    if(result.err==0)
        targetFolder = result.data[0];
    
    return targetFolder;
}

function chooseFile(){
    var result = window.cep.fs.showOpenDialogEx(false, false, "Please choose file to upload", "", ["png", "jpg", "jpeg", "gif", "pdf"]);
    var targetFile = undefined;
    if(result.err==0)
        targetFile = result.data[0];
    
    return targetFile;
}

//downloadFile(currUrl,fileName,mySaveFolder,imageDownloaded);
function downloadFile(url,fileName,insertionId,targetFolder,callback) {
	
    var urlArray = urlRegexp.exec(url); 
    
       
	if(urlArray.length<3) {
	    callback({error:"incorrect url: "+url});
        return; 
	}
	
	var host = urlArray[1];
	var path = urlArray[2];
    
    
    
    var fullPath = targetFolder + "/" + fileName;
    
    
  //  myAlert(fullPath);
	var file = fs.createWriteStream(fullPath);
      
    var options = {
        hostname: host,
        port: 443,
        method: 'GET',
        path: path
    };
 
    
     var myRequest = https.request(options, function(response) {
        var body = "";
        
        file.on('close', function() {  
           // myAlert("File downloaded "+insertionId);
              callback({error:false,
                  filePath:fullPath,
                  insertionId:insertionId
              });
              
          });  
          
        response.pipe(file); 

        response.on('error', function(err) {
        //   myAlert("File download error");
          	callback({error:"ERROR downloading "+fullPath+", "+err});
        });

        response.on('end', function() {
         
        });
		
    });
    
    myRequest.end();

}

function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats["size"];
    return fileSizeInBytes;
}

function addIDEventListener(logCallback){
	var csInterface = new CSInterface();
	
    csInterface.addEventListener("flatplanLog", function(event){
		logCallback(event.data);
    });
	
}

function getDate(str)
{
        var a = new Date(Number(str.substr(0,4)),Number(str.substr(5,2))-1,Number(str.substr(8,2)));
        return a.getTime();
}

function getProcessedPageDetails(res)
{
    var parsed = JSON.parse(res);
    if(parsed.Message) return {error:parsed.Message};
    return parsed;
}


function getProcessedLayout(res)
{
    var parsed = JSON.parse(res);
    if(parsed.Message) return {error:parsed.Message};
    return parsed;
}

function getProcessedList(res) {

    var parsed = JSON.parse(res);
    if(parsed.Message) return {error:parsed.Message};
     
  var rawList = parsed.content.List;

  for (var i = 0; i < rawList.length; i++) {
    rawList[i]._timestamp = getDate(rawList[i].IssueDate);
  }

  rawList.sort(function (a, b) {
    if (a._timestamp < b._timestamp) return 1;else return -1;
  }); //group by product, then by year

  var processedList = {};
  var processedListByYear = {};
  var processedListByProduct = {};
  var fullList = [];
  var years = {};
  var products = {};

  for (var i = 0; i < rawList.length; i++) {
    var currProduct = rawList[i];
    if (currProduct.ThumbnailImageUrl) currProduct.ThumbnailImageUrl = currProduct.ThumbnailImageUrl.replace(/\\/g, "/");
    fullList.push(currProduct);
    if (!processedList[currProduct.PubName]) processedList[currProduct.PubName] = {};
    if (!processedList[currProduct.PubName][currProduct.IssueYear]) processedList[currProduct.PubName][currProduct.IssueYear] = [];
    if (!processedListByYear[currProduct.IssueYear]) processedListByYear[currProduct.IssueYear] = [];
    if (!processedListByProduct[currProduct.PubName]) processedListByProduct[currProduct.PubName] = [];
    years[currProduct.IssueYear] = true;
    products[currProduct.PubName] = true;
    processedList[currProduct.PubName][currProduct.IssueYear].push(currProduct);
    processedListByProduct[currProduct.PubName].push(currProduct);
    processedListByYear[currProduct.IssueYear].push(currProduct);
  }

  var allProducts = []; //"All products"];//.concat(processedList.keys());

  var allYears = []; //"All years"];//.concat(processedListByYear.keys());

  for (var prop in years) {
    allYears.push(prop);
  }

  allYears.sort(function (a, b) {
    if (Number(a) < Number(b)) return 1;
    return -1;
  });

  for (var prop in products) {
    allProducts.push(prop);
  }

  allProducts.sort(function (a, b) {
    if (a > b) return 1;
    return -1;
  });
  
  return {
    fullList: fullList.slice(0, 10),
    processedList: processedList,
    processedListByYear: processedListByYear,
    processedListByProduct: processedListByProduct,
    maxYear: allYears[0],
    allProducts: ["All products"].concat(allProducts),
    allYears: ["All years"].concat(allYears),
    key:1
  };
}

try {
    ReactDOM.render(React.createElement(FlatplanApp), document.body);
} catch (e) {
    if(_debug) myAlert(e+":"+e.line)
}