# Instruções para Instalação da Macro SolidWorks (V3 - MASTER FINAL)

Esta versão resolve problemas de "Variável não definida" ao transformar o Formulário no centro da inteligência.

## 1. Preparação
1. No SolidWorks: **Ferramentas > Macro > Nova**.
2. **Tools > References**: Marque as seguintes:
    - **Microsoft XML, v6.0**
    - **Microsoft Scripting Runtime**

## 2. Ajuste da Interface (`frmProcessos`)
Certifique-se de que cada controle no seu UserForm tenha exatamente estes nomes na propriedade **(Name)**:

| Tipo de Controle | Nome em (Name) | Descrição |
| :--- | :--- | :--- |
| **Label** | `lblProgresso` | Exibe "Item x de y" |
| **Label** | `lblPeca` | Exibe o Código da peça |
| **TextBox** | `txtDescricao` | Para o nome/descrição |
| **TextBox** | `txtMaterial` | Para o material |
| **Label** | `lblQuantidade` | Exibe a quantidade total |
| **ComboBox** | `cmbCategoria` | FABRICADO/COMPRADO |
| **ListBox** | `lstProcessos` | Lista as etapas |
| **CommandButton**| `btnConfirmar` | Salvar e Próxima |

**Configurações de Interface (Propriedades)**:
1.  Selecione o **Formulário** (`frmProcessos`) e mude **ShowModal** para **False**.
2.  Selecione a **ListBox** (`lstProcessos`) e mude **MultiSelect** para `1 - fmMultiSelectMulti`. Isso permitirá selecionar vários processos ao mesmo tempo com um clique.

## 3. Código do Módulo Principal (`Module1`)
Substitua TODO o código do `Module1` por este:

```vba
Public swApp As SldWorks.SldWorks

Sub main()
    Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.ActiveDoc
    
    If swModel Is Nothing Then
        MsgBox "Abra uma montagem primeiro.", vbExclamation
        Exit Sub
    End If
    
    ' Reiniciar o processo
    Load frmProcessos
    frmProcessos.IniciarComMontagem swModel
End Sub
```

## 4. Código do Formulário (`frmProcessos`)
Substitua TODO o código do `frmProcessos` (botão direito > View Code) por este:

```vba
' --- VARIÁVEIS DE ESTADO (VIVEM DENTRO DO FORMULÁRIO) ---
Private mOP As String
Private mUrl As String
Private mProcessoList As String
Private mDictComps As Scripting.Dictionary
Private mChaves As Variant
Private mIndice As Integer
Private mPathAtual As String
Private mMainAssyPath As String ' Caminho da montagem principal para evitar erro 424

' --- INICIALIZAÇÃO ---
Public Sub IniciarComMontagem(swModel As SldWorks.ModelDoc2)
    mUrl = "http://192.168.0.186:3080/api"
    mMainAssyPath = LCase(swModel.GetPathName) ' Salva o caminho da montagem logo no início
    
    ' 1. Validar OP
    mOP = InputBox("Informe o Número da OP:", "Validação Master")
    If mOP = "" Then Unload Me: Exit Sub
    
    If Not ValidarOP(mOP) Then
        MsgBox "Ordem de Produção " & mOP & " não encontrada!", vbCritical
        Unload Me: Exit Sub
    End If
    
    ' 2. Carregar Processos
    mProcessoList = FetchProcessos()
    
    ' 3. Escanear Árvore
    Set mDictComps = New Scripting.Dictionary
    TraverseAssy swModel
    
    If mDictComps.Count = 0 Then
        MsgBox "Nenhum componente encontrado."
        Unload Me: Exit Sub
    End If
    
    ' 4. Começar
    mChaves = mDictComps.Keys
    mIndice = 0
    ProcessarProximo
End Sub

Private Sub ProcessarProximo()
    If mIndice >= mDictComps.Count Then
        MsgBox "Toda a BOM foi processada com sucesso!", vbInformation
        Unload Me
        Exit Sub
    End If
    
    mPathAtual = mChaves(mIndice)
    Dim qtd As Integer: qtd = mDictComps(mPathAtual)
    
    ' Re-atribui swApp para garantir que o objeto esteja ativo no escopo do formulário
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim swCompModel As SldWorks.ModelDoc2
    Dim errors As Long, warnings As Long
    Dim typeDoc As Long
    
    ' 1 = Part, 2 = Assembly
    If LCase(Right(mPathAtual, 7)) = ".sldasm" Then typeDoc = 2 Else typeDoc = 1
    
    ' Abrir e Vista
    Set swCompModel = swApp.OpenDoc6(mPathAtual, typeDoc, 1, "", errors, warnings) ' 1 = Silent
    
    ' Proteção contra falha ao abrir documento
    If swCompModel Is Nothing Then
        MsgBox "Não foi possível abrir: " & mPathAtual, vbExclamation
        mIndice = mIndice + 1
        ProcessarProximo
        Exit Sub
    End If
    
    swApp.ActivateDoc3 swCompModel.GetTitle, True, 2, errors ' 2 = Rebuild
    swCompModel.ViewZoomtofit2
    
    ' Preencher UI (Usando Me. para garantir referência aos controles)
    Me.lblProgresso.Caption = "Item " & (mIndice + 1) & " de " & mDictComps.Count
    Me.lblQuantidade.Caption = "Qtd na Montagem: " & qtd
    
    Dim cod As String: cod = Left(swCompModel.GetTitle, InStrRev(swCompModel.GetTitle, ".") - 1)
    If cod = "" Then cod = swCompModel.GetTitle
    Me.lblPeca.Caption = "Código: " & cod
    
    Dim desc As String, cat As String
    Dim swCustProp As SldWorks.CustomPropertyManager
    Set swCustProp = swCompModel.Extension.CustomPropertyManager("")
    swCustProp.Get4 "nome", False, "", desc
    swCustProp.Get4 "categoria", False, "", cat
    
    On Error Resume Next ' Previne erro se o controle txtDescricao ou txtMaterial não existir
    Me.txtDescricao.Text = desc
    Me.txtMaterial.Text = ""
    If typeDoc = 1 Then Me.txtMaterial.Text = swCompModel.MaterialIdName
    On Error GoTo 0
    
    Me.cmbCategoria.Clear
    Me.cmbCategoria.AddItem "FABRICADO"
    Me.cmbCategoria.AddItem "COMPRADO"
    If cat = "COMPRADO" Then Me.cmbCategoria.ListIndex = 1 Else Me.cmbCategoria.ListIndex = 0
    
    ' Listar Processos
    Me.lstProcessos.Clear
    PopularProcessosDaPeca swCompModel ' Puxa os já salvos no arquivo
    PopularListaBanco                  ' Adiciona os do banco
    
    Me.Show vbModeless
End Sub

Private Sub btnConfirmar_Click()
    ' 1. Salvar no SolidWorks
    SalvarNoArquivo
    
    ' 2. Enviar para API
    EnviarParaAPI
    
    ' 3. Fechar a peça/submontagem para liberar memória
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Dim typeDoc As Long
    ' 1 = Part, 2 = Assembly
    If LCase(Right(mPathAtual, 7)) = ".sldasm" Then typeDoc = 2 Else typeDoc = 1
    
    Dim errors As Long, warnings As Long
    Set swModel = swApp.OpenDoc6(mPathAtual, typeDoc, 1, "", errors, warnings) ' 1 = Silent
    
    If Not swModel Is Nothing Then
        ' Garantir que não estamos fechando a montagem principal usando o caminho salvo na inicialização
        If LCase(swModel.GetPathName) <> mMainAssyPath Then
            swApp.CloseDoc swModel.GetTitle
        End If
    End If
    
    ' 4. Próximo
    mIndice = mIndice + 1
    ProcessarProximo
End Sub

' --- AUXILIARES ---

Private Sub TraverseAssy(swParentDoc As SldWorks.ModelDoc2)
    Dim swAssy As SldWorks.AssemblyDoc
    Dim vComps As Variant, i As Integer
    If swParentDoc.GetType = 2 Then ' swDocASSEMBLY
        Set swAssy = swParentDoc
        vComps = swAssy.GetComponents(False)
        For i = 0 To UBound(vComps)
            Dim path As String: path = vComps(i).GetPathName
            If path <> "" Then
                If mDictComps.Exists(path) Then mDictComps(path) = mDictComps(path) + 1 Else mDictComps.Add path, 1
            End If
        Next i
    End If
End Sub

Private Sub SalvarNoArquivo()
    Dim swApp As SldWorks.SldWorks: Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Dim typeDoc As Long
    ' 1 = Part, 2 = Assembly
    If LCase(Right(mPathAtual, 7)) = ".sldasm" Then typeDoc = 2 Else typeDoc = 1
    
    ' Usa OpenDoc6 que retorna o handle se já estiver aberto
    Dim errors As Long, warnings As Long
    Set swModel = swApp.OpenDoc6(mPathAtual, typeDoc, 1, "", errors, warnings) ' 1 = Silent
    
    If swModel Is Nothing Then Exit Sub
    
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swModel.Extension.CustomPropertyManager("")
    
    ' 30 = swCustomInfoText, 2 = swCustomPropertyReplaceValue
    swCustProp.Add3 "categoria", 30, Me.cmbCategoria.Text, 2
    swCustProp.Add3 "nome", 30, Me.txtDescricao.Text, 2
    
    Dim i As Integer
    For i = 1 To 10: swCustProp.Delete "processo" & i: Next i
    
    Dim count As Integer: count = 1
    For i = 0 To Me.lstProcessos.ListCount - 1
        If Me.lstProcessos.Selected(i) Then
            swCustProp.Add3 "processo" & count, 30, Me.lstProcessos.List(i), 2
            count = count + 1
        End If
    Next i
    swModel.Save3 1, 0, 0 ' 1 = Silent
End Sub

Private Sub EnviarParaAPI()
    Dim http As Object: Set http = CreateObject("MSXML2.XMLHTTP")
    Dim escolhidos As String, i As Integer
    For i = 0 To Me.lstProcessos.ListCount - 1
        If Me.lstProcessos.Selected(i) Then escolhidos = escolhidos & """" & Me.lstProcessos.List(i) & ""","
    Next i
    If Len(escolhidos) > 0 Then escolhidos = Left(escolhidos, Len(escolhidos) - 1)
    
    Dim body As String
    Dim cod As String: cod = Replace(Me.lblPeca.Caption, "Código: ", "")
    Dim material As String
    On Error Resume Next: material = Me.txtMaterial.Text: On Error GoTo 0
    
    body = "{""numeroOP"": """ & mOP & """, ""peca"": {" & _
           """codigo"": """ & cod & """, " & _
           """descricao"": """ & Me.txtDescricao.Text & """, " & _
           """material"": """ & material & """, " & _
           """quantidade"": " & Val(Replace(Me.lblQuantidade.Caption, "Qtd na Montagem: ", "")) & ", " & _
           """categoria"": """ & Me.cmbCategoria.Text & """, " & _
           """processos"": [" & escolhidos & "]}}"
    
    http.Open "POST", mUrl & "/ops/import-bom", False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024"
    http.send body
End Sub

Private Sub PopularProcessosDaPeca(swModel As SldWorks.ModelDoc2)
    Dim swCustProp As SldWorks.CustomPropertyManager: Set swCustProp = swModel.Extension.CustomPropertyManager("")
    Dim val As String, i As Integer
    For i = 1 To 10
        swCustProp.Get4 "processo" & i, False, "", val
        If val <> "" Then
            Me.lstProcessos.AddItem val
            Me.lstProcessos.Selected(Me.lstProcessos.ListCount - 1) = True
        End If
    Next i
End Sub

Private Sub PopularListaBanco()
    Dim partes() As String: partes = Split(mProcessoList, """nome"": """)
    If UBound(partes) = 0 Then partes = Split(mProcessoList, """nome"":""")
    Dim i As Integer, nome As String
    For i = 1 To UBound(partes)
        nome = Split(partes(i), """")(0)
        Dim j As Integer: Dim existe As Boolean: existe = False
        For j = 0 To Me.lstProcessos.ListCount - 1
            If Me.lstProcessos.List(j) = nome Then existe = True: Exit For
        Next j
        If Not existe Then Me.lstProcessos.AddItem nome
    Next i
End Sub

Function ValidarOP(num As String) As Boolean
    On Error Resume Next
    Dim http As Object: Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", mUrl & "/ops/validar/" & num, False
    http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024"
    http.send
    ValidarOP = (http.Status = 200)
End Function

Function FetchProcessos() As String
    On Error Resume Next
    Dim http As Object: Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", mUrl & "/config/processos-peca", False
    http.setRequestHeader "X-SW-Secret", "someh-sw-integration-2024"
    http.send
    FetchProcessos = http.responseText
End Function
```
