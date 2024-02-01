class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        statck = "",
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(statck){
            thisstacl = statck
        } else {
            Error.captureStackTrace(this, this.constructor)
        }

    }
};

export {ApiError};


// reference : Node Api error 