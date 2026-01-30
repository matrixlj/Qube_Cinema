<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="UploadKey.aspx.cs" 
Inherits="UploadKey" UICulture="auto" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" >
<head runat="server">
    <title></title>
    <style type="text/css">
        body{background-color:inherit;}
    </style>
    <script type="text/javascript">
        function PageLoad() {
            if (navigator.appName == "Microsoft Internet Explorer")
                document.body.style.backgroundColor = parent.document.bgColor;
        }
    </script>
</head>
<body onload="PageLoad()">
    <form id="formKeyUpload" runat="server">
    <asp:HiddenField ID="errorMessage" runat="server"/>
    <div>        
        <asp:FileUpload ID="keyupload" style="width:320px;height:22px;"
            TabIndex="12" runat="server"/>
    </div>
    </form>
</body>
</html>
