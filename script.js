// --- CẤU HÌNH ---
// Dán link Web App URL Google Script (Đuôi /exec) của bạn vào đây:
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxdcWXQj6dUeEagGxHlhfXmVwQGBjRoEVkXZPNTLdTiYHcdOkG8Y-aK2CuDF5kH6yjeAQ/exec"; 

document.getElementById('display_date').value = new Date().toLocaleString('vi-VN');

// --- HÀM MỚI: BẬT/TẮT Ô NHẬP TAY ---
function toggleOtherInput() {
    const selectBox = document.getElementById('asset_type');
    const otherInput = document.getElementById('asset_type_other');
    
    if (selectBox.value === 'KHAC') {
        otherInput.style.display = 'block'; // Hiện ô nhập
        otherInput.required = true;         // Bắt buộc nhập
        otherInput.focus();                 // Tự động trỏ chuột vào
    } else {
        otherInput.style.display = 'none';  // Ẩn đi
        otherInput.required = false;        // Không bắt buộc nữa
        otherInput.value = '';              // Xóa nội dung cũ
    }
}

// ... (Phần code Camera giữ nguyên như cũ) ...
function onScanSuccess(decodedText, decodedResult) {
    const inputQR = document.getElementById('qr_code');
    const statusText = document.getElementById('camera-status');
    const scannerWrapper = document.querySelector('.scanner-wrapper');
    const iconRight = document.querySelector('.input-with-icon .icon-right');
    
    if (inputQR.value !== decodedText) {
        inputQR.value = decodedText;
        inputQR.classList.add('scanned');
        scannerWrapper.classList.add('success');
        iconRight.classList.remove('fa-qrcode');
        iconRight.classList.add('fa-check-circle');
        
        statusText.innerHTML = '<i class="fas fa-check-circle me-1"></i>Đã quét thành công!';
        statusText.className = 'status-text success';
        
        if (navigator.vibrate) navigator.vibrate(200);
        
        // Gọi hàm tìm kiếm dữ liệu cũ
        searchQRData(decodedText);
    }
}

// ... (Hàm searchQRData giữ nguyên như cũ) ...
function searchQRData(qrCode) {
    // Logic tìm kiếm (Copy lại từ code cũ của bạn nếu cần)
    // Lưu ý: Nếu tìm thấy asset_type không nằm trong danh sách select, 
    // bạn có thể cần thêm logic để chọn "KHAC" và điền value vào ô input.
    // Tuy nhiên ở mức cơ bản, ta cứ để nó tự động điền vào nếu khớp.
    
    // (Giữ nguyên phần fetch search như bài trước)
}

let html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 15, qrbox: {width: 250, height: 250} }, false);
html5QrcodeScanner.render(onScanSuccess);

// --- XỬ LÝ GỬI FORM (ĐÃ CẬP NHẬT LOGIC NHẬP TAY) ---
const form = document.getElementById('myForm');
const msgArea = document.getElementById('message-area');

form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const originalText = btn.innerHTML;
    
    // 1. Kiểm tra QR
    const qrVal = document.getElementById('qr_code').value;
    if (!qrVal) {
        alert('Vui lòng quét mã QR trước!');
        return;
    }

    // 2. XỬ LÝ LOẠI TÀI SẢN (Quan trọng)
    const selectType = document.getElementById('asset_type').value;
    let finalAssetType = selectType;
    
    // Nếu chọn KHÁC thì lấy giá trị từ ô nhập tay
    if (selectType === 'KHAC') {
        finalAssetType = document.getElementById('asset_type_other').value.trim();
        if (!finalAssetType) {
            alert('Vui lòng nhập tên loại tài sản!');
            document.getElementById('asset_type_other').focus();
            return;
        }
    }

    // 3. Hiệu ứng gửi
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang lưu...';
    btn.disabled = true;
    msgArea.style.display = 'none';

    let data = {
        qr_code: qrVal,
        user_name: document.getElementById('user_name').value,
        asset_type: finalAssetType, // Gửi giá trị đã xử lý
        status: document.getElementById('status').value
    };

    fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if(result.result === "success") {
            msgArea.innerHTML = `<div class="alert-custom alert-success-custom"><i class="fas fa-check-circle alert-icon"></i>Đã lưu dòng ${result.row}!</div>`;
            msgArea.style.display = 'block';
            
            // Reset form
            form.reset();
            document.getElementById('asset_type_other').style.display = 'none'; // Ẩn lại ô nhập tay
            document.getElementById('display_date').value = new Date().toLocaleString('vi-VN');
            
            // Reset giao diện camera
            document.getElementById('qr_code').classList.remove('scanned');
            document.querySelector('.scanner-wrapper').classList.remove('success');
            const iconRight = document.querySelector('.input-with-icon .icon-right');
            iconRight.classList.remove('fa-check-circle');
            iconRight.classList.add('fa-qrcode');
            document.getElementById('camera-status').className = 'status-text normal';
            document.getElementById('camera-status').innerHTML = '<i class="fas fa-info-circle me-1"></i>Sẵn sàng quét tiếp...';
        } else {
            throw new Error(result.error);
        }
    })
    .catch(error => {
        msgArea.innerHTML = '<div class="alert-custom alert-danger-custom"><i class="fas fa-times-circle alert-icon"></i>Lỗi kết nối!</div>';
        msgArea.style.display = 'block';
    })
    .finally(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        setTimeout(() => { msgArea.style.display = 'none'; }, 5000);
    });
});