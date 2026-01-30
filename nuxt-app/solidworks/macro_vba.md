# Instruções para Instalação da Macro SolidWorks (V3.4 - MASTER CUT-LIST)

Esta versão implementa o agrupamento inteligente por **Lista de Corte (Cut-List)**, garantindo que corpos idênticos sejam contados corretamente e multiplicados pela quantidade de peças na montagem.

## 1. Preparação
1. No SolidWorks: **Ferramentas > Macro > Nova**.
2. **Tools > References**: Marque as seguintes:
    - **Microsoft XML, v6.0**
    - **Microsoft Scripting Runtime**

## 2. Ajuste da Interface (`frmProcessos`)
Certifique-se de que cada controle no seu UserForm tenha exatamente estes nomes:

| Tipo de Controle | Nome em (Name) | Descrição |
| :--- | :--- | :--- |
| **Label** | `lblProgresso` | Exibe "Item x de y" |
| **TextBox** | `txtCodPeca` | Código da peça (Editável) |
| **TextBox** | `txtDescricao` | Para o nome/descrição |
| **TextBox** | `txtMaterial` | Para o material |
| **Label** | `lblQuantidade` | Exibe a quantidade total |
| **ComboBox** | `cmbCategoria` | FABRICADO/COMPRADO |
| **ListBox** | `lstProcessos` | Lista as etapas |
| **CheckBox** | `chkUsarConfig` | Incluir config no código? |
| **CheckBox** | `chkApenasConfig` | Usar **apenas** config como código? |
| **CommandButton**| `btnConfirmar` | Salvar e Próxima |
| **CommandButton**| `btnPular` | **[NOVO]** Pula sem salvar |

**Configurações de Interface (Propriedades)**:
1.  Selecione o **Formulário** (`frmProcessos`) e mude **ShowModal** para **False**.
2.  Selecione a **ListBox** (`lstProcessos`) e mude **MultiSelect** para `1 - fmMultiSelectMulti`.

## 3. Código do Módulo Principal (`Module1`)
```vba
Public swApp As SldWorks.SldWorks
Sub main()
    Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2: Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then
        MsgBox "Abra uma montagem primeiro.", vbExclamation
        Exit Sub
    End If
    Load frmProcessos
    frmProcessos.IniciarComMontagem swModel
End Sub
```

## 4. Código do Formulário (`frmProcessos`)
```vba
' --- VARIÁVEIS DE ESTADO ---
Private mOP As String
Private mUrl As String
Private mProcessoList As String
Private mDictComps As Scripting.Dictionary
Private mChaves As Variant
Private mIndice As Integer
Private mKeyAtual As String ' Chave: Path::Config::FolderIdx (-1 = Peça, 0+ = Cut-List)
Private mMainAssyPath As String
Private mCutListCache As Scripting.Dictionary

' --- INICIALIZAÇÃO ---
Public Sub IniciarComMontagem(swModel As SldWorks.ModelDoc2)
    mUrl = "http://192.168.0.186:3080/api"
    mMainAssyPath = LCase(swModel.GetPathName)
    mOP = InputBox("Informe o Número da OP:", "Validação Master Config")
    If mOP = "" Then
        Unload Me
        Exit Sub
    End If
    If Not ValidarOP(mOP) Then
        MsgBox "Ordem de Produção " & mOP & " não encontrada!", vbCritical
        Unload Me
        Exit Sub
    End If
    mProcessoList = FetchProcessos()
    Set mDictComps = New Scripting.Dictionary
    Set mCutListCache = New Scripting.Dictionary
    TraverseAssy swModel
    If mDictComps.Count = 0 Then
        MsgBox "Nenhum componente encontrado."
        Unload Me
        Exit Sub
    End If
    mChaves = mDictComps.Keys
    mIndice = 0
    ProcessarProximo
End Sub

Private Sub ProcessarProximo()
    If mIndice >= mDictComps.Count Then
        MsgBox "Processamento concluído!", vbInformation
        Unload Me: Exit Sub
    End If
    
    mKeyAtual = mChaves(mIndice)
    Dim qtdTotal As Long: qtdTotal = mDictComps(mKeyAtual)
    Dim partes() As String: partes = Split(mKeyAtual, "::")
    Dim path As String: path = partes(0): Dim configName As String: configName = partes(1): Dim folderIdx As Integer: folderIdx = CInt(partes(2))
    
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim swCompModel As SldWorks.ModelDoc2: Dim errs As Long, warns As Long
    Dim typeDoc As Long
    If LCase(Right(path, 7)) = ".sldasm" Then
        typeDoc = 2
    Else
        typeDoc = 1
    End If
    
    Set swCompModel = swApp.OpenDoc6(path, typeDoc, 1, "", errs, warns)
    If swCompModel Is Nothing Then
        mIndice = mIndice + 1
        ProcessarProximo
        Exit Sub
    End If
    
    swCompModel.ShowConfiguration2 configName
    swApp.ActivateDoc3 swCompModel.GetTitle, True, 2, errs
    swCompModel.ViewZoomtofit2
    
    Dim vBodies As Variant
    Dim swCutPropMgr As SldWorks.CustomPropertyManager
    If folderIdx >= 0 Then
        swCompModel.ClearSelection2 True
        Dim swFeat As SldWorks.Feature: Set swFeat = swCompModel.FirstFeature
        Dim currIdx As Integer: currIdx = 0
        Do While Not swFeat Is Nothing
            If swFeat.GetTypeName2 = "CutListFolder" Then
                If currIdx = folderIdx Then
                    Dim swCutFolder As SldWorks.BodyFolder: Set swCutFolder = swFeat.GetSpecificFeature2
                    ' Capturar o gerenciador de propriedades da Cut-List
                    Set swCutPropMgr = swFeat.CustomPropertyManager
                    vBodies = swCutFolder.GetBodies
                    If Not IsEmpty(vBodies) Then
                        Dim b As Integer
                        For b = 0 To UBound(vBodies)
                            vBodies(b).Select2 True, Nothing
                        Next b
                    End If
                    Exit Do
                End If
                currIdx = currIdx + 1
            End If
            Set swFeat = swFeat.GetNextFeature
        Loop
    End If
    
    Me.lblProgresso.Caption = "Item " & (mIndice + 1) & " de " & mDictComps.Count
    Me.lblQuantidade.Caption = "Qtd Total: " & qtdTotal
    
    ' Inteligência de Configuração
    Me.chkUsarConfig.Caption = "Incluir config: " & configName
    Dim configLixo As Boolean
    configLixo = (InStr(LCase(configName), "default") > 0 Or InStr(LCase(configName), "machined") > 0 Or InStr(LCase(configName), "usinado") > 0)
    Me.chkUsarConfig.Value = Not configLixo
    Me.chkApenasConfig.Value = False
    
    AtualizarSugestaoCodigo
    
    Dim desc As String, cat As String, propCod As String
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swCompModel.Extension.CustomPropertyManager(configName)
    
    ' Tentar pegar CÓDIGO da propriedade (prioridade)
    swCustProp.Get4 "codigo", False, "", propCod
    If propCod = "" Then swCustProp.Get4 "PartNo", False, "", propCod
    If propCod = "" Then swCompModel.Extension.CustomPropertyManager("").Get4 "codigo", False, "", propCod
    If propCod = "" Then swCompModel.Extension.CustomPropertyManager("").Get4 "PartNo", False, "", propCod
    
    ' Tentar pegar DESCRIÇÃO (prioridade para Cut-List com filtro anti-Sheet)
    If Not swCutPropMgr Is Nothing Then
        Dim v1 As String, v2 As String
        swCutPropMgr.Get4 "descrição", False, "", v1
        swCutPropMgr.Get4 "description", False, "", v2
        
        ' Lógica inteligente: Pega a que tiver conteúdo útil (não "Sheet" ou "Folha")
        If v1 <> "" And LCase(v1) <> "sheet" And LCase(v1) <> "folha" Then
            desc = v1
        ElseIf v2 <> "" And LCase(v2) <> "sheet" And LCase(v2) <> "folha" Then
            desc = v2
        Else
            ' Fallback se ambas forem genéricas ou vazias
            If v1 <> "" Then desc = v1 Else desc = v2
        End If
    End If
    
    If desc = "" Then
        swCustProp.Get4 "nome", False, "", desc
    End If
    If desc = "" Then
        swCompModel.Extension.CustomPropertyManager("").Get4 "nome", False, "", desc
    End If
    
    swCustProp.Get4 "categoria", False, "", cat
    
    On Error Resume Next
    Me.txtDescricao.Text = desc: Me.txtMaterial.Text = ""
    If typeDoc = 1 Then
        Dim resMat As String
        If folderIdx >= 0 And Not IsEmpty(vBodies) Then resMat = vBodies(0).GetMaterialIdName2(configName)
        If resMat = "" Then swCustProp.Get4 "SW-Material", False, "", resMat
        If resMat = "" Then swCompModel.Extension.CustomPropertyManager("").Get4 "SW-Material", False, "", resMat
        If resMat = "" Or InStr(LCase(resMat), "inst") > 0 Then resMat = swCompModel.MaterialIdName
        Dim matPartes() As String: resMat = Replace(resMat, ":", "|"): matPartes = Split(resMat, "|")
        If UBound(matPartes) >= 0 Then
            Dim cleanMat As String: cleanMat = Trim(matPartes(UBound(matPartes)))
            If IsNumeric(cleanMat) And UBound(matPartes) > 0 Then cleanMat = Trim(matPartes(UBound(matPartes) - 1))
            Me.txtMaterial.Text = cleanMat
        End If
    End If
    On Error GoTo 0
    Me.cmbCategoria.Clear: Me.cmbCategoria.AddItem "FABRICADO": Me.cmbCategoria.AddItem "COMPRADO"
    If cat = "COMPRADO" Then
        Me.cmbCategoria.ListIndex = 1
    Else
        Me.cmbCategoria.ListIndex = 0
    End If
    Me.lstProcessos.Clear: PopularProcessosDaPeca swCompModel, configName: PopularListaBanco
    Me.Show vbModeless
End Sub

Private Sub btnConfirmar_Click()
    SalvarNoArquivo
    EnviarParaAPI
    FinalizarItem
End Sub

Private Sub btnPular_Click()
    FinalizarItem
End Sub

Private Sub FinalizarItem()
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim path As String: path = Split(mKeyAtual, "::")(0)
    Dim fechar As Boolean: fechar = True
    If mIndice + 1 < mDictComps.Count Then
        If LCase(Split(mChaves(mIndice + 1), "::")(0)) = LCase(path) Then fechar = False
    End If
    If fechar And LCase(path) <> mMainAssyPath Then
        Dim errs As Long, warns As Long
        Dim typeDoc As Long
        If LCase(Right(path, 7)) = ".sldasm" Then
            typeDoc = 2
        Else
            typeDoc = 1
        End If
        Dim swModelFechar As SldWorks.ModelDoc2
        Set swModelFechar = swApp.OpenDoc6(path, typeDoc, 1, "", errs, warns)
        If Not swModelFechar Is Nothing Then swApp.CloseDoc swModelFechar.GetTitle
    End If
    mIndice = mIndice + 1: ProcessarProximo
End Sub

Private Sub AtualizarSugestaoCodigo()
    On Error Resume Next
    Dim partes() As String: partes = Split(mKeyAtual, "::")
    Dim path As String: path = partes(0): Dim configName As String: configName = partes(1): Dim folderIdx As Integer: folderIdx = CInt(partes(2))
    
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2: Set swModel = swApp.ActiveDoc
    
    ' Garantir que estamos no modelo certo (caso o usuário tenha trocado de janela)
    If LCase(swModel.GetPathName) <> LCase(path) Then
        Dim errs As Long, warns As Long
        Dim typeDoc As Long
        If LCase(Right(path, 7)) = ".sldasm" Then
            typeDoc = 2
        Else
            typeDoc = 1
        End If
        Set swModel = swApp.OpenDoc6(path, typeDoc, 1, "", errs, warns)
    End If
    
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swModel.Extension.CustomPropertyManager(configName)
    
    Dim propCod As String
    swCustProp.Get4 "codigo", False, "", propCod
    If propCod = "" Then swCustProp.Get4 "PartNo", False, "", propCod
    If propCod = "" Then swModel.Extension.CustomPropertyManager("").Get4 "codigo", False, "", propCod
    If propCod = "" Then swModel.Extension.CustomPropertyManager("").Get4 "PartNo", False, "", propCod
    
    Dim baseName As String
    If propCod <> "" Then
        baseName = propCod
    Else
        Dim fName As String: fName = Mid(path, InStrRev(path, "\") + 1)
        baseName = Left(fName, InStrRev(fName, ".") - 1)
        If baseName = "" Then baseName = fName
    End If
    
    Dim sug As String
    If Me.chkApenasConfig.Value = True Then
        sug = configName
    ElseIf Me.chkUsarConfig.Value = True Then
        sug = baseName & " (" & configName & ")"
    Else
        sug = baseName
    End If
    
    If folderIdx >= 0 Then
        sug = sug & "." & (folderIdx + 1)
    End If
    
    Me.txtCodPeca.Text = sug
End Sub

Private Sub chkUsarConfig_Click(): AtualizarSugestaoCodigo: End Sub
Private Sub chkApenasConfig_Click(): AtualizarSugestaoCodigo: End Sub

Private Sub TraverseAssy(swParentDoc As SldWorks.ModelDoc2)
    Dim swAssy As SldWorks.AssemblyDoc: Dim vComps As Variant, i As Integer, j As Integer
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    If swParentDoc.GetType = 2 Then
        Set swAssy = swParentDoc: vComps = swAssy.GetComponents(False)
        For i = 0 To UBound(vComps)
            Dim swComp As SldWorks.Component2: Set swComp = vComps(i)
            If swComp.IsSuppressed Then GoTo ProximoComp
            Dim path As String: path = swComp.GetPathName: Dim conf As String: conf = swComp.ReferencedConfiguration: If path = "" Then GoTo ProximoComp
            Dim keyPai As String: keyPai = path & "::" & conf & "::-1": Dim cacheKey As String: cacheKey = path & "::" & conf
            If mDictComps.Exists(keyPai) Then
                mDictComps(keyPai) = mDictComps(keyPai) + 1
                If mCutListCache.Exists(cacheKey) Then
                    Dim vFolders As Variant: vFolders = Split(mCutListCache(cacheKey), "|")
                    For j = 0 To UBound(vFolders)
                        Dim fData() As String: fData = Split(vFolders(j), ":")
                        Dim kCorpo As String: kCorpo = path & "::" & conf & "::" & fData(0)
                        mDictComps(kCorpo) = mDictComps(kCorpo) + CLng(fData(1)) ' Multiplica peça x corpos
                    Next j
                End If
            Else
                mDictComps.Add keyPai, 1
                If LCase(Right(path, 7)) = ".sldprt" Then
                    Dim swPart As SldWorks.ModelDoc2: Dim err As Long, warn As Long: Set swPart = swApp.OpenDoc6(path, 1, 1, "", err, warn)
                    If Not swPart Is Nothing Then
                        Dim swFeat As SldWorks.Feature: Set swFeat = swPart.FirstFeature
                        Dim currIdx As Integer: currIdx = 0: Dim cacheStr As String: cacheStr = ""
                        Do While Not swFeat Is Nothing
                            If swFeat.GetTypeName2 = "CutListFolder" Then
                                Dim swCutFolder As SldWorks.BodyFolder: Set swCutFolder = swFeat.GetSpecificFeature2
                                Dim bCount As Long: bCount = swCutFolder.GetBodyCount
                                If bCount > 0 Then
                                    mDictComps.Add path & "::" & conf & "::" & currIdx, bCount
                                    cacheStr = cacheStr & currIdx & ":" & bCount & "|"
                                End If
                                currIdx = currIdx + 1
                            End If
                            Set swFeat = swFeat.GetNextFeature
                        Loop
                        If Len(cacheStr) > 0 Then mCutListCache.Add cacheKey, Left(cacheStr, Len(cacheStr) - 1)
                        If LCase(swPart.GetPathName) <> mMainAssyPath Then swApp.CloseDoc swPart.GetTitle
                    End If
                End If
            End If
ProximoComp:
        Next i
    End If
End Sub

Private Sub SalvarNoArquivo()
    Dim partes() As String: partes = Split(mKeyAtual, "::")
    If CInt(partes(2)) >= 0 Then Exit Sub
    Dim path As String: path = partes(0): Dim configName As String: configName = partes(1)
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2: Dim errs As Long, warns As Long
    Dim typeDoc As Long
    If LCase(Right(path, 7)) = ".sldasm" Then
        typeDoc = 2
    Else
        typeDoc = 1
    End If
    Set swModel = swApp.OpenDoc6(path, typeDoc, 1, "", errs, warns)
    If swModel Is Nothing Then Exit Sub
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swModel.Extension.CustomPropertyManager(configName)
    swCustProp.Add3 "categoria", 30, Me.cmbCategoria.Text, 2: swCustProp.Add3 "nome", 30, Me.txtDescricao.Text, 2
    Dim i As Integer: For i = 1 To 10: swCustProp.Delete "processo" & i: Next i
    Dim count As Integer: count = 1
    For i = 0 To Me.lstProcessos.ListCount - 1
        If Me.lstProcessos.Selected(i) Then swCustProp.Add3 "processo" & count, 30, Me.lstProcessos.List(i), 2: count = count + 1
    Next i
    swModel.Save3 1, 0, 0
End Sub

Private Sub EnviarParaAPI()
    Dim http As Object: Set http = CreateObject("MSXML2.XMLHTTP")
    Dim escolhidos As String, i As Integer: For i = 0 To Me.lstProcessos.ListCount - 1
        If Me.lstProcessos.Selected(i) Then escolhidos = escolhidos & """" & Me.lstProcessos.List(i) & ""","
    Next i
    If Len(escolhidos) > 0 Then escolhidos = Left(escolhidos, Len(escolhidos) - 1)
    Dim body As String: body = "{""numeroOP"": """ & mOP & """, ""peca"": {""codigo"": """ & Me.txtCodPeca.Text & """, ""descricao"": """ & Me.txtDescricao.Text & """, ""material"": """ & Me.txtMaterial.Text & """, ""quantidade"": " & mDictComps(mKeyAtual) & ", ""categoria"": """ & Me.cmbCategoria.Text & """, ""processos"": [" & escolhidos & "]}}"
    http.Open "POST", mUrl & "/ops/import-bom", False: http.setRequestHeader "Content-Type", "application/json": http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024": http.send body
End Sub

Private Sub PopularProcessosDaPeca(swModel As SldWorks.ModelDoc2, configName As String)
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swModel.Extension.CustomPropertyManager(configName)
    Dim val As String, i As Integer: For i = 1 To 10
        swCustProp.Get4 "processo" & i, False, "", val: If val = "" Then swModel.Extension.CustomPropertyManager("").Get4 "processo" & i, False, "", val
        If val <> "" Then Me.lstProcessos.AddItem val: Me.lstProcessos.Selected(Me.lstProcessos.ListCount - 1) = True
    Next i
End Sub

Private Sub PopularListaBanco()
    Dim partes() As String: partes = Split(mProcessoList, """nome"": """)
    If UBound(partes) = 0 Then partes = Split(mProcessoList, """nome"":""")
    Dim i As Integer, nome As String: For i = 1 To UBound(partes)
        nome = Split(partes(i), """")(0): Dim j As Integer: Dim existe As Boolean: existe = False
        For j = 0 To Me.lstProcessos.ListCount - 1: If Me.lstProcessos.List(j) = nome Then existe = True: Exit For
        Next j: If Not existe Then Me.lstProcessos.AddItem nome
    Next i
End Sub

Function ValidarOP(num As String) As Boolean
    On Error Resume Next: Dim http As Object: Set http = CreateObject("MSXML2.XMLHTTP"): http.Open "GET", mUrl & "/ops/validar/" & num, False: http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024": http.send: ValidarOP = (http.Status = 200)
End Function

Function FetchProcessos() As String
    On Error Resume Next: Dim http As Object: Set http = CreateObject("MSXML2.XMLHTTP"): http.Open "GET", mUrl & "/config/processos-peca", False: http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024": http.send: FetchProcessos = http.responseText
End Function
