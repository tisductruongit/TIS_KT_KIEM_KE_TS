const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5TMJRaSKHo7m4cWVRyoTWs4rAiAsEwAEv9vG1B06zUMOp-cgYztnM_2td8yhhFz_BrQ/exec"; 


document.getElementById('display_date').value = new Date().toLocaleString('vi-VN');


const msgArea = document.getElementById('message-area');

function showMessage(type, text) {
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    const alertClass = type === 'success' ? 'alert-success-custom' : 'alert-danger-custom';
    
    msgArea.innerHTML = `
        <div class="alert-custom ${alertClass}">
            <i class="fas ${icon} alert-icon"></i>
            <div>${text}</div>
        </div>
    `;
    msgArea.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => { msgArea.style.display = 'none'; }, 5000);
    }
}

function toggleOtherInput() {
    const selectBox = document.getElementById('asset_type');
    const otherInput = document.getElementById('asset_type_other');
    
    if (selectBox.value === 'KHAC') {
        otherInput.style.display = 'block';
        otherInput.required = true;
        otherInput.focus();
    } else {
        otherInput.style.display = 'none';
        otherInput.required = false;
        otherInput.value = '';
    }
}


function searchQRData(qrCode) {
    const statusText = document.getElementById('camera-status');
    const btnSubmit = document.getElementById('btnSubmit');
    
    statusText.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang kiểm tra dữ liệu...';
    statusText.className = 'status-text normal';
    document.getElementById('user_name').disabled = true;

    fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "search", qr_code: qrCode })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === "found") {

            document.getElementById('user_name').value = data.user_name;
            document.getElementById('status').value = data.status;
            
            const selectBox = document.getElementById('asset_type');
            const options = Array.from(selectBox.options).map(opt => opt.value);
            
            if (options.includes(data.asset_type)) {
                selectBox.value = data.asset_type;
                toggleOtherInput();
            } else {
                selectBox.value = 'KHAC';
                toggleOtherInput();
                document.getElementById('asset_type_other').value = data.asset_type;
            }

            statusText.innerHTML = `<i class="fas fa-lock me-1"></i>Đã định danh (Ngày: ${data.last_date})`;
            statusText.className = 'status-text error';
            
            showMessage('error', `⛔ <b>CẢNH BÁO:</b> Mã này đã có dữ liệu!<br>Người dùng: ${data.user_name}`);
            
            btnSubmit.innerHTML = '<i class="fas fa-ban me-2"></i>ĐÃ TỒN TẠI - KHÔNG THỂ THÊM';
            btnSubmit.classList.remove('btn-primary', 'tis-btn'); // Bỏ màu đỏ
            btnSubmit.classList.add('btn-secondary'); // Thêm màu xám
            btnSubmit.disabled = true; // Khóa cứng nút

        } else {

            document.getElementById('user_name').value = "";
            document.getElementById('asset_type').value = "";
            toggleOtherInput(); // Ẩn ô nhập tay
            document.getElementById('status').value = "Tốt";
            
            statusText.innerHTML = '<i class="fas fa-plus-circle me-1"></i>Tài sản mới (Chưa có dữ liệu)';
            statusText.className = 'status-text success'; // Chữ xanh
            msgArea.style.display = 'none';

            btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>LƯU THÔNG TIN';
            btnSubmit.classList.remove('btn-secondary');
            btnSubmit.classList.add('btn-primary', 'tis-btn'); // Trả lại màu đỏ
            btnSubmit.disabled = false; // Cho phép bấm
        }
    })
    .catch(error => {
        console.error("Lỗi tìm kiếm:", error);
        statusText.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i>Lỗi mạng khi tra cứu!';
        statusText.className = 'status-text error';
    })
    .finally(() => {

        document.getElementById('user_name').disabled = false;
    });
}

let lastScannedCode = null;

function onScanSuccess(decodedText, decodedResult) {
    const inputQR = document.getElementById('qr_code');
    const scannerWrapper = document.querySelector('.scanner-wrapper');
    const iconRight = document.querySelector('.input-with-icon .icon-right');

    if (decodedText !== lastScannedCode) {
        lastScannedCode = decodedText;
        inputQR.value = decodedText;
        
        inputQR.classList.add('scanned');
        scannerWrapper.classList.add('success');
        iconRight.classList.remove('fa-qrcode');
        iconRight.classList.add('fa-check-circle');

        if (navigator.vibrate) navigator.vibrate(200);

        searchQRData(decodedText);
    }
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", 
    { fps: 15, qrbox: {width: 250, height: 250}, aspectRatio: 1.0 }, 
    false
);
html5QrcodeScanner.render(onScanSuccess, (error) => {});


const form = document.getElementById('myForm');

form.addEventListener('submit', e => {
    e.preventDefault();
    
    const btn = document.getElementById('btnSubmit');
    const originalBtnText = btn.innerHTML;
    
    const qrVal = document.getElementById('qr_code').value;
    if (!qrVal) {
        showMessage('error', 'Vui lòng quét mã QR trước!');
        return;
    }

    const selectType = document.getElementById('asset_type').value;
    let finalAssetType = selectType;
    
    if (selectType === 'KHAC') {
        finalAssetType = document.getElementById('asset_type_other').value.trim();
        if (!finalAssetType) {
            showMessage('error', 'Bạn chọn "KHÁC", vui lòng nhập tên loại tài sản!');
            document.getElementById('asset_type_other').focus();
            return;
        }
    }

    // 3. Hiệu ứng đang gửi
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang lưu...';
    btn.disabled = true;
    msgArea.style.display = 'none';

    // 4. Gom dữ liệu
    let data = {
        qr_code: qrVal,
        user_name: document.getElementById('user_name').value,
        asset_type: finalAssetType, // Gửi giá trị đã xử lý
        status: document.getElementById('status').value
    };

    // 5. Gửi Request
    fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if(result.result === "success") {

            showMessage('success', `✅ Đã lưu thành công! (Dòng ${result.row})`);

            form.reset();
            lastScannedCode = null; 
            toggleOtherInput(); // Ẩn ô nhập tay
            document.getElementById('display_date').value = new Date().toLocaleString('vi-VN');

            document.getElementById('qr_code').classList.remove('scanned');
            document.querySelector('.scanner-wrapper').classList.remove('success');
            const iconRight = document.querySelector('.input-with-icon .icon-right');
            iconRight.classList.remove('fa-check-circle');
            iconRight.classList.add('fa-qrcode');
            
            document.getElementById('camera-status').className = 'status-text normal';
            document.getElementById('camera-status').innerHTML = '<i class="fas fa-info-circle me-1"></i>Sẵn sàng quét tiếp...';
        } 
        else if (result.result === "duplicate") {
            showMessage('error', '⛔ ' + result.message);
        }
        else {
            throw new Error(result.error || "Lỗi server");
        }
    })
    .catch(error => {
        console.error('Fetch Error:', error);
        showMessage('error', '⚠️ Lỗi kết nối! Kiểm tra mạng hoặc Link Script.');
    })
    .finally(() => {
        if (btn.innerHTML.includes('Đang lưu')) {
             btn.innerHTML = originalBtnText;
             btn.disabled = false;
        }
    });
});
