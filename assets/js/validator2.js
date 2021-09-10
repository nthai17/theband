function validator (formSelector, alertMessage) {
    // lấy form tương ứng để dùng
    var formValidator = document.querySelector(formSelector);

    // lưu các hàm kiểm tra của form
    var formRules = {
        required: function(value){
            return value ? undefined : 'Vui lòng nhập trường này.'
        },
        email: function(value){
                const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
                return regex.test(value) ? undefined : 'Vui lòng nhập đúng email.'
        },
        min: function(min){
            return function (value) {
                return value.length >= min ? undefined : `Nhập ít nhất ${min} kí tự.`
            }
        },
        confirm: function(value){
            return value === formValidator.querySelector('[name="password"]').value ? undefined : 'Mật khẩu không khớp.'
        },
        number: function(value){
            return Number(value) && value > 0 & value%parseInt(value) === 0  ? undefined : 'Vui lòng nhập số lượng.'
        },
    };
    // hàm lấy thẻ cha chứa thẻ thông báo lỗi
    function getParent (selection) {
        while (selection.parentElement) {
            if (selection.parentElement.matches('.form-group')) {
                return selection.parentElement
            } else {
                selection = selection.parentElement
            }
        }
    }
    // hàm xử lý khi validate
    function handleValidate(input) {
        // lấy các rule (hàm kiểm tra) của input đang blur
        var ruleOfinput = iuputsRules[input.name]
        // lấy thẻ để hiện báo lỗi
        var errorElement = getParent(input).querySelector('.form-message');
        // khai báo biến lưu trữ lỗi
        var errorMessage;
        if(ruleOfinput){
            // lặp qua các rule (hàm kiểm tra) - truyền value của input vào rule 
            for (rule of ruleOfinput) {
                errorMessage = rule(input.value)
                if(errorMessage) break;
            };
        }
        
        // nếu trả ra errorMessage thì gán thông báo cho thẻ báo và css lỗi
        if(errorMessage) {
            getParent(input).classList.add('invalid')
            errorElement.innerText = errorMessage;
        } 
        // nếu trả ra errorMessage undefine (không lỗi) thì bỏ thông báo
        else {
            errorElement.innerText = '';
            getParent(input).classList.remove('invalid')
        }
        // return lấy errorMessage để xử lý submit form
        return !errorMessage;
    };
    // khỏi tạo đối tượng để lưu trữ các rule tương ứng với mỗi input {'inputname' : [rule1, rule2,..]}
    var iuputsRules = {};
    // mảng các input trong form
    var inputs = formValidator.querySelectorAll('[name]');
    // duyệt qua từng input để lấy tên các rule ở attr rule (quy ước) và lắng nghe sự kiện
    for (var input of inputs) {
        // lấy tên các rule (dạng chuỗi rule1|rule2|...)
        var rules = input.getAttribute('rules');
        // nếu input có cài rule thì mới chạy
        if (rules) {
            // tách chuỗi thành mảng [rule1, rule2,...]
            var rulesArr = rules.split('|');
            // lặp qua từng rule để kiểm tra nếu có TH đặc biệt (min:6)
            for (var rule of rulesArr) {
                var ruleInfo;
                var ruleFunc = formRules[rule];
                //nếu rule dạng min:6 thì tách ra mảng lấy [min, 6] - lấy [0] là min để get được hàm min, lấy [1] là 6 truyền đối số cho hàm min => lấy được hàm bên trong dùng (value)
                if (rule.includes(':')) {
                    ruleInfo = rule.split(':')
                    ruleFunc = formRules[ruleInfo[0]](ruleInfo[1])
                }
                if (Array.isArray(iuputsRules[input.name])) {
                    iuputsRules[input.name].push(ruleFunc)
                } else {
                    iuputsRules[input.name] = [ruleFunc];
                };
            };
            // lắng nghe sự kiện blur trên các thẻ input
            input.onblur = function(e) {
                var inputTarget = e.target;
                handleValidate(inputTarget);
            }
            // lắng nghe sự kiên change để bỏ các thông báo và hiệu ứng khi đang điên input
            input.oninput = function(e) {
                var inputTarget = e.target;
                getParent(inputTarget).classList.remove('invalid')
                getParent(inputTarget).querySelector('.form-message').innerText = '';
            };
        };
    };
    // Sự kiện submit form
    var _this = this;
    formValidator.onsubmit = function(e) {
        e.preventDefault();
        var isFormValid = true;
        for (var input of inputs) {
            if (!handleValidate(input)) {
                isFormValid = false;
            }
        }
        if (isFormValid) { //nếu muốn submit mặc định thì bỏ code bên dưới, thay vào formValidator.submit()
            if (typeof _this.onSubmit === 'function') {
                //lấy tất cả input của form (nodelist)
                // chuyển nodelist về dạng mảng,
                // duyệt mảng lấy tên làm key, value làm value cho đối tượng lưu giữ thông tin submit
                var formValues = Array.from(inputs).reduce(function(values, input){
                    switch (input.type) {
                        case 'radio':
                            if (input.matches(':checked')) {
                                    values[input.name] = input.value;
                                }
                            else if (!values[input.name]) { //chạy đến nút cuối mà k có nút nào ấn thì mới trả về rõng
                                    values[input.name] = '';
                                }
                            break;
                        case 'checkbox':
                            if (input.matches(':checked')) {
                                if (!Array.isArray(values[input.name])){
                                    values[input.name] = []
                                }
                                values[input.name].push(input.value)
                            }else if (!values[input.name]) { //chạy đến nút cuối mà k có nút nào ấn thì mới trả về rõng
                                values[input.name] = '';
                            }
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }
                    return values;
                }, {});
                
                //chạy hàm onSubmit với đối số là đối tượng {name: name, password: password,...}
                // hàm onSubmit sẽ nhận data và call API 
                _this.onSubmit(formValues, alertMessage);

                // reset input về trống
                for (var input of inputs) {
                    input.value = '';
                };
            }
        }
    }
}