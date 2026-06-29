# Instruções para Instalação da Macro SolidWorks - Versão Completa (Com Anexos)

Esta versão da macro é focada em integrar o SolidWorks com o módulo PCP de forma mais completa. Além de exportar as estruturas (BOM) e criar ordens de serviço, ela gera **automaticamente** arquivos em PDF, DXF e IGS para solicitação de orçamentos e serviços de manufatura.

## 1. Preparação
1. No SolidWorks: **Ferramentas > Macro > Nova**.
2. **Tools > References**: Marque as seguintes bibliotecas:
    - **Microsoft XML, v6.0**
    - **Microsoft Scripting Runtime**

## 2. Ajuste da Interface Gráfica (`frmProcessos`)
Para a versão completa, seu UserForm no VBA precisará ter **todos** os campos abaixo. 
*Atenção aos nomes de cada controle na propriedade `(Name)`.*

| Tipo de Controle | Nome em (Name) | Descrição |
| :--- | :--- | :--- |
| **Label** | `lblProgresso` | Exibe "Item x de y" |
| **TextBox** | `txtCodPeca` | Código da peça |
| **TextBox** | `txtDescricao` | Descrição/Nome |
| **TextBox** | `txtMaterial` | Material da peça |
| **Label** | `lblQuantidade` | Exibe a quantidade total |
| **ComboBox** | `cmbCategoria` | Categorias: FABRICADO / COMPRADO |
| **ComboBox** | `cmbSubcategoria`| Subcategoria (Exibida apenas se COMPRADO) |
| **ListBox** | `lstProcessos` | Etapas do PCP (Exibida apenas se FABRICADO) |
| **CheckBox** | `chkUsarConfig` | Incluir config no código? |
| **CheckBox** | `chkApenasConfig` | Usar **apenas** config como código? |
| **CheckBox** | `chkPDF` | Exportar e Anexar PDF do Desenho? |
| **CheckBox** | `chkDXF` | Exportar e Anexar DXF (Chapas - Flat Pattern)? |
| **CheckBox** | `chkIGS` | Exportar e Anexar IGS (Peças Usinadas)? |
| **CommandButton**| `btnConfirmar` | Salvar e Enviar API |
| **CommandButton**| `btnPular` | Pular sem salvar |
| **CommandButton**| `btnVoltar` | Voltar para a peça anterior |

**Ajustes das Propriedades**:
1. Formulário (`frmProcessos`): Mude **ShowModal** para `False`.
2. ListBox (`lstProcessos`): Mude **MultiSelect** para `1 - fmMultiSelectMulti`.
3. ComboBox (`cmbSubcategoria`): Deixe a propriedade **Visible** como `False` por padrão no painel de propriedades.

---

## 3. Código do Módulo Principal (`Module1`)
Copie e cole no Módulo:

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

---

## 4. Código do Formulário (`frmProcessos`)
Copie e cole o código inteiro abaixo dentro da janela de código do `frmProcessos`:

```vba
' --- VARIÁVEIS DE ESTADO ---
Private mOP As String
Private mUrl As String
Private mProcessoList As String
Private mCategoriasList As String
Private mPecasNaOP As String ' Guarda a lista de peças que já existem na OP
Private mDictComps As Scripting.Dictionary
Private mChaves As Variant
Private mIndice As Integer
Private mKeyAtual As String ' Chave: Path::Config::FolderIdx (-1 = Peça, 0+ = Cut-List)
Private mMainAssyPath As String
Private mCutListCache As Scripting.Dictionary
Private mCurrentBodies As Variant ' Guarda os corpos do Cut-List atual para exportação

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
    
    ' Carregar as listas do servidor via API
    mProcessoList = FetchData("/configuracoes/processos-peca")
    mCategoriasList = FetchData("/configuracoes/categorias-fornecedor")
    
    Set mDictComps = New Scripting.Dictionary
    Set mCutListCache = New Scripting.Dictionary
    TraverseAssy swModel
    If mDictComps.count = 0 Then
        MsgBox "Nenhum componente encontrado."
        Unload Me
        Exit Sub
    End If
    mChaves = mDictComps.Keys
    mIndice = 0
    ProcessarProximo
End Sub

Private Sub ProcessarProximo()
    If mIndice >= mDictComps.count Then
        MsgBox "Processamento concluído!", vbInformation
        Unload Me: Exit Sub
    End If
    
    mKeyAtual = mChaves(mIndice)
    mCurrentBodies = Empty
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
                Dim swCutFolderCheck As SldWorks.BodyFolder: Set swCutFolderCheck = swFeat.GetSpecificFeature2
                If swCutFolderCheck.GetBodyCount > 0 Then
                    If currIdx = folderIdx Then
                        Dim swCutFolder As SldWorks.BodyFolder: Set swCutFolder = swCutFolderCheck
                        Set swCutPropMgr = swFeat.CustomPropertyManager
                        vBodies = swCutFolder.GetBodies
                        If Not IsEmpty(vBodies) Then
                            mCurrentBodies = vBodies
                            Dim b As Integer
                            For b = 0 To UBound(vBodies)
                                vBodies(b).Select2 True, Nothing
                            Next b
                        End If
                        Exit Do
                    End If
                    currIdx = currIdx + 1
                End If
            End If
            Set swFeat = swFeat.GetNextFeature
        Loop
    End If
    
    Me.lblProgresso.Caption = "Item " & (mIndice + 1) & " de " & mDictComps.count
    Me.lblQuantidade.Caption = "Qtd Total: " & qtdTotal
    
    Me.chkUsarConfig.Caption = "Incluir config: " & configName
    Dim configLixo As Boolean
    configLixo = (InStr(LCase(configName), "default") > 0 Or InStr(LCase(configName), "machined") > 0 Or InStr(LCase(configName), "usinado") > 0)
    Me.chkUsarConfig.Value = Not configLixo
    Me.chkApenasConfig.Value = False
    
    AtualizarSugestaoCodigo
    
    Dim desc As String, cat As String, subcat As String, propCod As String
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swCompModel.Extension.CustomPropertyManager(configName)
    
    swCustProp.Get4 "codigo", False, "", propCod
    If propCod = "" Then swCustProp.Get4 "PartNo", False, "", propCod
    If propCod = "" Then swCompModel.Extension.CustomPropertyManager("").Get4 "codigo", False, "", propCod
    If propCod = "" Then swCompModel.Extension.CustomPropertyManager("").Get4 "PartNo", False, "", propCod
    
    If Not swCutPropMgr Is Nothing Then
        Dim v1 As String, v2 As String
        swCutPropMgr.Get4 "descrição", False, "", v1
        swCutPropMgr.Get4 "description", False, "", v2
        If v1 <> "" And LCase(v1) <> "sheet" And LCase(v1) <> "folha" Then
            desc = v1
        ElseIf v2 <> "" And LCase(v2) <> "sheet" And LCase(v2) <> "folha" Then
            desc = v2
        Else
            If v1 <> "" Then desc = v1 Else desc = v2
        End If
    End If
    If desc = "" Then swCustProp.Get4 "nome", False, "", desc
    If desc = "" Then swCompModel.Extension.CustomPropertyManager("").Get4 "nome", False, "", desc
    
    swCustProp.Get4 "categoria", False, "", cat
    swCustProp.Get4 "subcategoria", False, "", subcat
    
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
    
    ' Popula Subcategorias e Processos do Servidor
    PopularListaProcessos swCompModel, configName
    PopularListaSubcategorias subcat
    
    ' Aciona a Lógica de Visibilidade (Através do Change Event)
    If cat = "COMPRADO" Then
        Me.cmbCategoria.ListIndex = 1
    Else
        Me.cmbCategoria.ListIndex = 0
    End If
    
    ' Pré-Setar check boxes de exportação baseados na categoria sugerida
    If cat = "COMPRADO" Then
        Me.chkPDF.Value = False
        Me.chkDXF.Value = False
        Me.chkIGS.Value = False
    Else
        Me.chkPDF.Value = True
        If InStr(LCase(Me.txtMaterial.Text), "chapa") > 0 Or InStr(LCase(desc), "chapa") > 0 Or folderIdx >= 0 Then
            Me.chkDXF.Value = True
            Me.chkIGS.Value = False
        Else
            Me.chkDXF.Value = False
            Me.chkIGS.Value = True
        End If
    End If
    
    Me.Show vbModeless
End Sub

Private Sub cmbCategoria_Change()
    If Me.cmbCategoria.Text = "COMPRADO" Then
        Me.lstProcessos.Visible = False
        Me.cmbSubcategoria.Visible = True
    Else
        Me.lstProcessos.Visible = True
        Me.cmbSubcategoria.Visible = False
    End If
End Sub

Private Sub btnConfirmar_Click()
    ' Verifica se a peça já existe na OP atual (ignorando espaços e maiúsculas/minúsculas para evitar falhas)
    Dim pList As String: pList = Replace(mPecasNaOP, " ", "")
    Dim searchStr As String: searchStr = "|" & Replace(Me.txtCodPeca.Text, " ", "") & "|"
    
    If InStr(1, pList, searchStr, vbTextCompare) > 0 Then
        Dim resp As Integer
        resp = MsgBox("A peça '" & Me.txtCodPeca.Text & "' já existe nesta OP!" & vbCrLf & vbCrLf & _
               "Escolha uma opção:" & vbCrLf & _
               "- [Sim] para SOBRESCREVER a BOM e os Desenhos" & vbCrLf & _
               "- [Não] para PULAR esta peça" & vbCrLf & _
               "- [Cancelar] para EDITAR o código manualmente na tela", vbYesNoCancel + vbExclamation, "Peça Duplicada Identificada")
               
        If resp = vbNo Then
            btnPular_Click
            Exit Sub
        ElseIf resp = vbCancel Then
            Exit Sub
        End If
        ' Se clicou em SIM, apenas segue o fluxo para sobrescrever.
    End If

    Dim pecaId As Long
    SalvarNoArquivo
    pecaId = EnviarParaAPI()
    
    ' Se API respondeu com ID, e exportação foi solicitada, aciona
    If pecaId > 0 Then
        ' Adiciona o código na memória para avisar caso a mesma peça apareça novamente neste fluxo
        mPecasNaOP = mPecasNaOP & "|" & Me.txtCodPeca.Text & "|"
        ExportarArquivos pecaId
    End If
    
    FinalizarItem
End Sub

Private Sub btnPular_Click()
    FinalizarItem
End Sub

Private Sub btnVoltar_Click()
    If mIndice > 0 Then
        ' Volta 1 casa para retornar à peça anterior (o índice atual reflete a tela ativa)
        mIndice = mIndice - 1
        ProcessarProximo
    Else
        MsgBox "Este já é o primeiro item da lista.", vbInformation, "Atenção"
    End If
End Sub

Private Sub FinalizarItem()
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim path As String: path = Split(mKeyAtual, "::")(0)
    Dim fechar As Boolean: fechar = True
    If mIndice + 1 < mDictComps.count Then
        If LCase(Split(mChaves(mIndice + 1), "::")(0)) = LCase(path) Then fechar = False
    End If
    If fechar And LCase(path) <> mMainAssyPath Then
        Dim errs As Long, warns As Long
        Dim typeDoc As Long
        If LCase(Right(path, 7)) = ".sldasm" Then typeDoc = 2 Else typeDoc = 1
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
    
    If LCase(swModel.GetPathName) <> LCase(path) Then
        Dim errs As Long, warns As Long, typeDoc As Long
        If LCase(Right(path, 7)) = ".sldasm" Then typeDoc = 2 Else typeDoc = 1
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
    
    If folderIdx >= 0 Then sug = sug & "." & (folderIdx + 1)
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
                        mDictComps(kCorpo) = mDictComps(kCorpo) + CLng(fData(1))
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
                                    currIdx = currIdx + 1
                                End If
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
    If LCase(Right(path, 7)) = ".sldasm" Then typeDoc = 2 Else typeDoc = 1
    Set swModel = swApp.OpenDoc6(path, typeDoc, 1, "", errs, warns)
    If swModel Is Nothing Then Exit Sub
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swModel.Extension.CustomPropertyManager(configName)
    swCustProp.Add3 "categoria", 30, Me.cmbCategoria.Text, 2: swCustProp.Add3 "nome", 30, Me.txtDescricao.Text, 2
    swCustProp.Add3 "subcategoria", 30, Me.cmbSubcategoria.Text, 2
    Dim i As Integer: For i = 1 To 10: swCustProp.Delete "processo" & i: Next i
    Dim count As Integer: count = 1
    For i = 0 To Me.lstProcessos.ListCount - 1
        If Me.lstProcessos.Selected(i) Then swCustProp.Add3 "processo" & count, 30, Me.lstProcessos.List(i), 2: count = count + 1
    Next i
    swModel.Save3 1, 0, 0
End Sub

Private Function EnviarParaAPI() As Long
    On Error GoTo Erro
    Dim http As Object: Set http = CreateObject("MSXML2.XMLHTTP")
    Dim escolhidos As String, i As Integer
    If Me.cmbCategoria.Text = "FABRICADO" Then
        For i = 0 To Me.lstProcessos.ListCount - 1
            If Me.lstProcessos.Selected(i) Then escolhidos = escolhidos & """" & Me.lstProcessos.List(i) & ""","
        Next i
        If Len(escolhidos) > 0 Then escolhidos = Left(escolhidos, Len(escolhidos) - 1)
    End If
    
    Dim selSubCat As String: selSubCat = ""
    If Me.cmbCategoria.Text = "COMPRADO" Then selSubCat = Me.cmbSubcategoria.Text
    
    Dim body As String: body = "{""numeroOP"": """ & mOP & """, ""peca"": {""codigo"": """ & Me.txtCodPeca.Text & """, ""descricao"": """ & Me.txtDescricao.Text & """, ""material"": """ & Me.txtMaterial.Text & """, ""quantidade"": " & mDictComps(mKeyAtual) & ", ""categoria"": """ & Me.cmbCategoria.Text & """, ""subcategoria"": """ & selSubCat & """, ""processos"": [" & escolhidos & "]}}"
    
    http.Open "POST", mUrl & "/ops/import-bom", False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024"
    http.send body
    
    If http.Status = 200 Then
        Dim resp As String: resp = http.responseText
        Dim pos As Long: pos = InStr(resp, """pecaId"":")
        If pos > 0 Then EnviarParaAPI = CLng(Split(Mid(resp, pos + 9), ",")(0))
    End If
    Exit Function
Erro:
    EnviarParaAPI = 0
End Function

Private Sub ExportarArquivos(pecaId As Long)
    Dim selIdx As Integer
    On Error Resume Next
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2: Set swModel = swApp.ActiveDoc
    Dim tempFolder As String: tempFolder = Environ("TEMP") & "\"
    Dim tempPath As String
    
    ' Obter Pasta do 3D para buscar o desenho
    Dim modelPath As String: modelPath = swModel.GetPathName
    Dim folderPath As String: folderPath = Left(modelPath, InStrRev(modelPath, "\"))
    Dim baseName As String: baseName = Mid(modelPath, InStrRev(modelPath, "\") + 1)
    baseName = Left(baseName, InStrRev(baseName, ".") - 1)
    
    ' 1. Exportar PDF
    If Me.chkPDF.Value = True Then
        Dim localPdfPath As String: localPdfPath = folderPath & baseName & ".pdf"
        Dim drwPath As String: drwPath = folderPath & baseName & ".slddrw"
        
        ' TRATATIVA MAIS RÁPIDA E DIRETA:
        ' Se o PDF já existir na mesma pasta do arquivo 3D, envia ele direto sem abrir o desenho!
        If Dir(localPdfPath) <> "" Then
            UploadArquivo pecaId, localPdfPath, Me.txtCodPeca.Text & ".pdf"
            
        ' Se não existir, tenta gerar o PDF e salva na mesma pasta (evita bloqueios da pasta TEMP)
        ElseIf Dir(drwPath) <> "" Then
            Dim errs As Long, warns As Long
            Dim swDraw As SldWorks.ModelDoc2
            
            Set swDraw = swApp.OpenDoc6(drwPath, 3, 2, "", errs, warns)
            If Not swDraw Is Nothing Then
                swApp.ActivateDoc3 swDraw.GetTitle, True, 1, errs
                
                Dim vSheets As Variant: vSheets = swDraw.GetSheetNames
                If Not IsEmpty(vSheets) Then swDraw.ActivateSheet vSheets(0)
                
                swDraw.ForceRebuild3 True
                swDraw.ViewZoomtofit2
                Dim t As Integer: For t = 1 To 5: DoEvents: Next t
                
                ' Salva o PDF na mesma pasta do projeto
                swDraw.Extension.SaveAs localPdfPath, 0, 0, Nothing, errs, warns
                
                swApp.CloseDoc swDraw.GetTitle
                swApp.ActivateDoc3 swModel.GetTitle, True, 1, errs
                
                If Dir(localPdfPath) <> "" Then
                    UploadArquivo pecaId, localPdfPath, Me.txtCodPeca.Text & ".pdf"
                End If
            End If
        End If
    End If
    
    ' 2. Exportar DXF (Flat Pattern para Chapas)
    If Me.chkDXF.Value = True And swModel.GetType = 1 Then
        Dim localDxfPath As String: localDxfPath = folderPath & Me.txtCodPeca.Text & ".dxf"
        
        ' Se o DXF já existir, envia ele direto!
        If Dir(localDxfPath) <> "" Then
            UploadArquivo pecaId, localDxfPath, Me.txtCodPeca.Text & ".dxf"
            
        ' Se não existir, tenta gerar o DXF
        Else
            tempPath = tempFolder & "corte_" & Me.txtCodPeca.Text & ".dxf"
            Dim swPart As SldWorks.PartDoc: Set swPart = swModel
            
            ' A abertura do PDF logo acima cancelou todas as seleções da tela!
            ' O SolidWorks exige que a FEATURE de Padrão Plano (Flat Pattern) esteja selecionada para exportar o corpo correto.
            swModel.ClearSelection2 True
            Dim bFeatSelected As Boolean: bFeatSelected = False
            
            If Not IsEmpty(mCurrentBodies) Then
                ' Varre as features de Flat Pattern para encontrar qual pertence a este corpo
                Dim featMgr As SldWorks.FeatureManager: Set featMgr = swModel.FeatureManager
                Dim fpFolder As SldWorks.FlatPatternFolder: Set fpFolder = featMgr.GetFlatPatternFolder
                
                If Not fpFolder Is Nothing Then
                    Dim flatPatterns As Variant: flatPatterns = fpFolder.GetFlatPatterns
                    If Not IsEmpty(flatPatterns) Then
                        Dim fpIdx As Integer
                        For fpIdx = 0 To UBound(flatPatterns)
                            Dim swFeat As SldWorks.Feature: Set swFeat = flatPatterns(fpIdx)
                            Dim fpData As SldWorks.FlatPatternFeatureData: Set fpData = swFeat.GetDefinition
                            
                            If Not fpData Is Nothing Then
                                fpData.AccessSelections swModel, Nothing
                                Dim fixedFace As SldWorks.Face2: Set fixedFace = fpData.FixedFace2
                                If Not fixedFace Is Nothing Then
                                    Dim faceBody As SldWorks.Body2: Set faceBody = fixedFace.GetBody
                                    If faceBody.Name = mCurrentBodies(0).Name Then
                                        fpData.ReleaseSelectionAccess
                                        swFeat.Select2 True, 0
                                        bFeatSelected = True
                                        Exit For
                                    End If
                                End If
                                fpData.ReleaseSelectionAccess
                            End If
                        Next fpIdx
                    End If
                End If
                
                ' Fallback: se não achar a feature, seleciona o corpo 3D
                If Not bFeatSelected Then
                    For selIdx = 0 To UBound(mCurrentBodies)
                        mCurrentBodies(selIdx).Select2 True, Nothing
                    Next selIdx
                End If
            End If
            
            ' Exportar Flat Pattern direto do Part
            ' Opções: 1 (Geometria) + 4 (Linhas de dobra) = 5
            Dim bRetDXF As Boolean
            bRetDXF = swPart.ExportToDWG2(tempPath, modelPath, 1, True, Empty, False, False, 5, Empty)
            
            If Dir(tempPath) <> "" Then
                UploadArquivo pecaId, tempPath, Me.txtCodPeca.Text & ".dxf"
                Kill tempPath
            End If
        End If
    End If
    
    ' 3. Exportar IGS (Peças Usinadas)
    If Me.chkIGS.Value = True And swModel.GetType = 1 Then
        Dim localIgsPath As String: localIgsPath = folderPath & Me.txtCodPeca.Text & ".igs"
        
        ' Se o IGS já existir, usa ele!
        If Dir(localIgsPath) <> "" Then
            UploadArquivo pecaId, localIgsPath, Me.txtCodPeca.Text & ".igs"
            
        ' Se não existir, tenta gerar o IGS do corpo isolado
        Else
            tempPath = tempFolder & "usinagem_" & Me.txtCodPeca.Text & ".igs"
            
            ' Garantir que o corpo alvo seja o único selecionado no momento da exportação!
            swModel.ClearSelection2 True
            If Not IsEmpty(mCurrentBodies) Then
                For selIdx = 0 To UBound(mCurrentBodies)
                    mCurrentBodies(selIdx).Select2 True, Nothing
                Next selIdx
            End If
            
            Dim errsIGS As Long, warnsIGS As Long
            swModel.Extension.SaveAs tempPath, 0, 1, Nothing, errsIGS, warnsIGS
            
            If Dir(tempPath) <> "" Then
                UploadArquivo pecaId, tempPath, Me.txtCodPeca.Text & ".igs"
                Kill tempPath
            End If
        End If
    End If
End Sub

Private Sub UploadArquivo(pecaId As Long, filePath As String, fileName As String)
    Dim http As Object
    ' Usar WinHttp no lugar de MSXML2 para garantir que o array de bytes (PDF Binário) não seja corrompido
    Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
    
    Dim adodbStream As Object: Set adodbStream = CreateObject("ADODB.Stream")
    
    adodbStream.Type = 1 ' adTypeBinary
    adodbStream.Open
    adodbStream.LoadFromFile filePath
    Dim fileContent As Variant: fileContent = adodbStream.Read
    adodbStream.Close
    
    http.Open "POST", mUrl & "/pecas/" & pecaId & "/desenho", False
    http.setRequestHeader "Content-Type", "application/pdf"
    http.setRequestHeader "X-File-Name", fileName
    http.send fileContent
End Sub

Private Sub PopularListaProcessos(swModel As SldWorks.ModelDoc2, configName As String)
    Me.lstProcessos.Clear
    Dim partes() As String: partes = Split(mProcessoList, """nome"": """)
    If UBound(partes) = 0 Then partes = Split(mProcessoList, """nome"":""")
    
    Dim arrBanco() As String: ReDim arrBanco(0)
    Dim i As Integer, countBanco As Integer: countBanco = 0
    For i = 1 To UBound(partes)
        ReDim Preserve arrBanco(countBanco)
        arrBanco(countBanco) = Split(partes(i), """")(0)
        countBanco = countBanco + 1
    Next i
    
    For i = 0 To countBanco - 1
        Me.lstProcessos.AddItem arrBanco(i)
    Next i
    
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swModel.Extension.CustomPropertyManager(configName)
    Dim val As String, j As Integer
    For i = 1 To 10
        swCustProp.Get4 "processo" & i, False, "", val
        If val = "" Then swModel.Extension.CustomPropertyManager("").Get4 "processo" & i, False, "", val
        If val <> "" Then
            For j = 0 To Me.lstProcessos.ListCount - 1
                If Me.lstProcessos.List(j) = val Then Me.lstProcessos.Selected(j) = True
            Next j
        End If
    Next i
End Sub

Private Sub PopularListaSubcategorias(valSelecionado As String)
    Me.cmbSubcategoria.Clear
    Dim partes() As String: partes = Split(mCategoriasList, """nome"": """)
    If UBound(partes) = 0 Then partes = Split(mCategoriasList, """nome"":""")
    
    Dim i As Integer
    For i = 1 To UBound(partes)
        Me.cmbSubcategoria.AddItem Split(partes(i), """")(0)
    Next i
    
    If valSelecionado <> "" Then
        Me.cmbSubcategoria.Text = valSelecionado
    Else
        If Me.cmbSubcategoria.ListCount > 0 Then Me.cmbSubcategoria.ListIndex = 0
    End If
End Sub

Function ValidarOP(ByVal num As String) As Boolean
    On Error Resume Next
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", mUrl & "/ops/validar/" & num & "?t=" & Timer, False
    http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024"
    http.setRequestHeader "Cache-Control", "no-cache"
    http.setRequestHeader "Pragma", "no-cache"
    http.send
    
    If http.Status = 200 Then
        mPecasNaOP = http.responseText
        ValidarOP = True
    Else
        ValidarOP = False
    End If
End Function

Function FetchData(endpoint As String) As String
    On Error Resume Next
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", mUrl & endpoint, False
    http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024"
    http.send
    FetchData = http.responseText
End Function
-xxx-
