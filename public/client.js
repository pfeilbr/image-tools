const loadingSectionElement = document.querySelector('#loading-section')
const outputSectionElement = document.querySelector('#output-section')
const formElement = document.querySelector('#uploadForm')
const fileInputElement = document.querySelector('[type=file]')


const displayImageOnCanvas = (nestedArrays) => {
  const width = nestedArrays[0].length
  const height = nestedArrays.length;
  
  const canvasElement = document.getElementById('canvas');
  canvasElement.width = width;
  canvasElement.height = height;
  const ctx = canvasElement.getContext('2d');
  let x = 0, y = 0;
  for (const row of nestedArrays) {
    x = 0
    for (const col of row) {
      const r = col[0]
      const g = col[1]
      const b = col[2]
      const a = 255
      ctx.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
      ctx.fillRect( x, y, 1, 1 );
      x++
    }
    y++
  }  
}


const fetchDataForImage = async (imageName) => {
  console.log(`imageName=${imageName}`)
  const imageDataURL = `${document.location.href}code?imageName=${encodeURIComponent(imageName)}`
  const resp = await fetch(imageDataURL);
  const data = await resp.json();
  const nestedArrays = data.nestedArrays;  

  const width = nestedArrays[0].length
  const height = nestedArrays.length;

  const labelElement = document.getElementById("label");
  labelElement.innerText = `Lua table (nested arrays) code for "${data.imageFilePath}" (width=${width}, height=${height})`
  
  const dataURLElement = document.querySelector('#data-url')
  dataURLElement.innerText = imageDataURL
  dataURLElement.href = imageDataURL
  
  const outputElement = document.getElementById("output");
  outputElement.value = data.luaCode
  
  displayImageOnCanvas(nestedArrays)
  const canvasLabelElement = document.getElementById("canvasLabel");
  canvasLabelElement.innerText = "Display of Image in HTML Canvas from Pixel Data"  
}

const toggleElementVisibility = (element) => {
  if (element.style.display === "" || element.style.display === "block") {
    element.style.display = "none";  
  } else {
    element.style.display = "block";
  }
}

const show = (element) => {
  element.style.display = "block";  
}

const hide = (element) => {
  element.style.display = "none";  
}

const buildFileUploadsSection = async () => {
  const uploadedImagesElement = document.querySelector('#uploaded-images')
  uploadedImagesElement.innerHTML = "";
  const uploadsDataURL = `${document.location.href}uploads`
  const resp = await fetch(uploadsDataURL);
  const data = await resp.json();
  console.log(data.images);
  data.images.map(filename => {
    const a = document.createElement('a');
    const linkText = document.createTextNode(filename);
    a.appendChild(linkText);
    a.title = filename;
    a.href = "#";
    a.style['padding-right']="5px"
    uploadedImagesElement.appendChild(a);
    //uploadedImagesElement.appendChild(document.createElement('br'));
    a.addEventListener('click', async (e) => {
      e.preventDefault()
      hide(outputSectionElement);      
      show(loadingSectionElement);
      const imageName = a.innerText
      await fetchDataForImage(imageName);
        
      hide(loadingSectionElement);
      show(outputSectionElement);      
    })
  })  
}

( async () => {
  
  await buildFileUploadsSection();
    
  fileInputElement.addEventListener('change', (e) => {
    hide(loadingSectionElement);
    hide(outputSectionElement);
  })
  
  hide(loadingSectionElement);
  hide(outputSectionElement);
  
  formElement.addEventListener('submit', async (e) => {
    
    show(loadingSectionElement);
    
    e.preventDefault()

    const files = document.querySelector('[type=file]').files
    const formData = new FormData()

    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      console.log(file)
      formData.append(`imageFile`, file)
    }

    const resp = fetch("/upload", {
      method: 'POST',
      body: formData,
    })
    
    const imageName = files[0].name
    await fetchDataForImage(imageName);
    await buildFileUploadsSection();
        
    hide(loadingSectionElement);
    show(outputSectionElement);
  })  
  
})()
