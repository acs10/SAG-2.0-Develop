;(function () {
    /**
     * Check for the various File API support.
     */
    window.file_help_checkFileAPI = function () {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            return true;
        }
        // alert('The File APIs are not fully supported by your browser. Fallback required.');
        return false;
    }

    /**
     * read text input
     */
    window.file_help_readText = function (fileInput, callback) {

        if (typeof callback !== "function") {
            return false;
        }

        //placeholder for text output
        var output = "";
        if (file_help_checkFileAPI() && fileInput.files && fileInput.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                output = e.target.result;
                callback(output);
            };//end onload()
            reader.readAsText(fileInput.files[0]);

        }//end if html5 filelist support
        else if (ActiveXObject && fileInput) { //fallback to IE 6-8 support via ActiveX
            try {
                var reader = new ActiveXObject("Scripting.FileSystemObject");
                var file = reader.OpenTextFile(fileInput, 1); //ActiveX File Object
                output = file.ReadAll(); //text contents of file
                file.Close(); //close file "input stream"
                callback(output);
            } catch (e) {
                if (e.number == -2146827859) {
                    alert('Unable to access local files due to browser security settings. ' +
                        'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' +
                        'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"');
                }
            }
        } else { //this is where you could fallback to Java Applet, Flash or similar
            return false;
        }
        return true;
    }
})();
