const axios = require('axios');
const FormData = require('form-data');
const { execSync } = require('child_process');

async function testValidImage() {
    execSync('npm i canvas');
    const { createCanvas } = require('canvas');

    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 300);
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText('This is a mock text extracted from the uploaded image.', 50, 100);
    ctx.fillText('E=mc^2 indicates energy equals mass times the speed of light squared.', 50, 150);

    const buffer = canvas.toBuffer('image/png');

    const formData = new FormData();
    formData.append('file', buffer, {
        filename: 'test.png',
        contentType: 'image/png',
    });

    try {
        console.log("Testing with valid image text...");
        const res = await axios.post('https://studybuddyaiapi-afaxhvgdgmdvawad.southeastasia-01.azurewebsites.net/api/upload', formData, {
            headers: formData.getHeaders(),
        });
        console.log('Image Text response:', res.data);
    } catch (e) {
        console.error('Image Text error:', e.response?.data || e.message);
    }
}

testValidImage();
