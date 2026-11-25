/* Unified source explorers for the original Pattern Patrol project. */
(()=>{
 const entries=[
  {title:["A thought, and what belongs to it","Ein Gedanke und seine Daten"],file:"Day.kt · Thought.kt · Observation.kt",codeFile:"Day.kt · Thought.kt · Observation.kt",description:["A day contains thoughts, each with separate lists for personal observations and AI suggestions. Both use the same Observation model, while Distortion defines the reference entries.","Ein Tag enthält mehrere Gedanken, die jeweils eigene Listen für persönliche Beobachtungen und KI-Vorschläge haben. Beide nutzen das gleiche Observation-Modell. Distortion definiert die Referenzeinträge."],diagram:false,code:`data class Day(
    val date: LocalDate,
    val dayOfWeek: Int,
    val weekday: String,
    val thoughts: MutableList<Thought> = mutableListOf(),
    var isSelected: Boolean = false
)

data class Thought(
    var title: String = "",
    var content: String = "",
    val observations: MutableList<Observation> = mutableListOf(),
    val aiOpinion: MutableList<Observation> = mutableListOf()
)

data class Observation(
    val distortionType: String,
    var explanation: String,
    var isDone: Boolean = false
)`},
  {title:["A place for reference material","Referenzmaterial an einer Stelle"],file:"Repository.kt",codeFile:"Repository.kt",description:["The repository provides the reference list of cognitive distortions, sample data and instructions used for the AI request.","Das Repository stellt eine Liste kognitiver Verzerrungen, Beispieldaten und die Anweisungen für die KI-Anfrage bereit."],diagram:false,code:`fun loadDistortions(): MutableList<Distortion> {
    return mutableListOf(
        Distortion("ALL-OR-NOTHING THINKING",
            "You see things in black-and-white categories...",
            "One example for this distortion",
            "Another example for this distortion"),
        // More distortions follow
    )
}

fun loadDays(): MutableList<Day> {
    // Sample days generated relative to today
}`},
  {title:["Keeping the same thought in view","Derselbe Gedanke über mehrere Ansichten"],file:"MainViewModel.kt",codeFile:"MainViewModel.kt",description:["A shared ViewModel keeps track of the selected day and thought across screens.","Ein gemeinsames ViewModel verwaltet den ausgewählten Tag und den jeweiligen Gedanken über mehrere Ansichten hinweg."],diagram:false,code:`private var _selectedDay = MutableLiveData<Day>(
    _daysList.value?.first()
)
val selectedDay: LiveData<Day>
    get() = _selectedDay

private var _selectedThought = MutableLiveData<Thought>(
    Thought()
)
val selectedThought: LiveData<Thought>
    get() = _selectedThought`},
  {title:["Turning state into screens","Aus Daten werden Ansichten"],file:"DetailFragment.kt",codeFile:"DetailFragment.kt",description:["Fragments observe changes in the ViewModel, while RecyclerView adapters display the corresponding lists.","Fragments reagieren auf Änderungen im ViewModel. RecyclerView-Adapter stellen die entsprechenden Listen dar."],diagram:false,code:`private val viewModel: MainViewModel by activityViewModels()

viewModel.observationsList.observe(viewLifecycleOwner) {
    observationAdapter.submitList(it)
}

viewModel.aiSuggestion.observe(viewLifecycleOwner) {
    aiSuggestionAdapter.submitList(it)
}`}

 ];

 const architecture=entries.map(e=>({file:e.codeFile,code:e.code,description:e.description}));
 const ai=[{"description": ["The prompt asks the AI to identify possible cognitive distortions and return each one with an explanation in a fixed format.", "Der Prompt weist die KI an, mögliche kognitive Verzerrungen zu identifizieren und zu jeder eine Erklärung in einem festgelegten Format zurückzugeben."], "file": "Repository.kt", "code": "You are a respected psychologist and behavioral therapist with fifteen years of experience in helping individuals to identify and correct their cognitive distortions, in order to break negative thought, behavior patterns and ultimately leading to a less self critical perception on human interaction, relationships and the self.\nI’ ll write you a thought, and for each cognitive distortion (according to Aaron Beck’s list of cognitive distortions) you can identify in it I want you to respond the distortion type and a short explanation that enables the user to understand how to tell that this distortion is present in the thought.\nFollow these steps:\n1. check for possible cognitive distortions being present\n2. if you can not identify any distortion, respond with the words “NO DISTORTION”.\n3. if you can identify exactly one distortion, respond with the two lines. One only stating the Distortion type and the second line should be used for a short explanation.\n4. if you can identify more than one distortion execute step 3, afterwards simply add another line break and continue with the next found distortion in the same way as with the first.\n\n Example response:\n\n“Overgeneralization\n\nThe individual is taking one negative event and applying it to all areas of their life, leading to the belief that everything is always bad or hopeless. The individual's belief that they will never graduate assumes that this one exam will determine their entire academic future, which is an example of overgeneralization.\n\nCatastrophizing\n\nThe individual is exaggerating the negative outcome of getting a B minus on their math exam and catastrophizing it to the point of assuming that they will never graduate.”\n\nThe Thought I want you to respond to is '$input'."}, {"description": ["A coroutine sends the request to OpenAI and passes the response back for processing.", "Eine Coroutine sendet die Anfrage an OpenAI und übergibt die Antwort zur weiteren Verarbeitung."], "file": "MainViewModel.kt", "code": "val instruction = repository.loadInstructions(userInput)\nval chatCompletionRequest = ChatCompletionRequest(\n    model = ModelId(\"gpt-3.5-turbo\"),\n    messages = listOf(ChatMessage(\n        role = ChatRole.User,\n        content = instruction\n    ))\n)\nviewModelScope.launch {\n    val completion = openAI.chatCompletion(chatCompletionRequest)\n    adjustAiResponse(completion.choices[0].message!!.content)\n}"}, {"description": ["The returned text is split into pairs of distortion names and explanations, then converted into Observation objects.", "Der zurückgegebene Text wird in Paare aus Verzerrungsnamen und Erklärungen aufgeteilt und anschließend in Observation-Objekte umgewandelt."], "file": "MainViewModel.kt", "code": "val tmpResponse = mutableListOf<String>()\ntmpResponse.addAll(response.split(\"\\n\"))\ntmpResponse.removeIf { it.isEmpty() || it == \"\\n\" || it == \" \" }\n\nfor (i in 0 until tmpResponse.size - 1 step 2)\n    _aiSuggestion.value!!.add(\n        Observation(tmpResponse[i], tmpResponse[i + 1])\n    )"}];
 // Highlight Kotlin snippets without changing their content or requiring a library.
 // The original AI prompt is prose, so it intentionally stays unhighlighted.
 const kotlinKeywords=new Set('as break by catch class companion const constructor continue data delegate do else enum false finally for fun get if import in interface internal is it lateinit null object open operator out override package private protected public return sealed set suspend super this throw true try typealias val var when while'.split(' '));
 const kotlinTypes=new Set('Any Boolean Byte Char Double Float Int List LiveData LocalDate Long Map MutableList MutableLiveData Nothing Number Observation Repository Set Short String Thought Day Distortion Unit ViewModel MainViewModel'.split(' '));
 const kotlinTokens=/(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_][A-Za-z_0-9]*\b|\b\d+(?:\.\d+)?\b)/g;
 function highlightKotlin(element,source){
   const fragment=document.createDocumentFragment();
   let last=0;
   for(const token of source.matchAll(kotlinTokens)){
     const index=token.index;
     if(index>last)fragment.append(document.createTextNode(source.slice(last,index)));
     const value=token[0];let kind='';
     if(value.startsWith('//'))kind='comment';
     else if(value.startsWith('"')||value.startsWith("'"))kind='str';
     else if(kotlinKeywords.has(value))kind='kw';
     else if(kotlinTypes.has(value)||/^[A-Z][A-Za-z_0-9]*$/.test(value))kind='type';
     else if(/^\d/.test(value))kind='num';
     else if(/^\w/.test(value)&&/^\s*\(/.test(source.slice(index+value.length)))kind='fn';
     if(kind){const span=document.createElement('span');span.className='pp-syntax-'+kind;span.textContent=value;fragment.append(span)}
     else fragment.append(document.createTextNode(value));
     last=index+value.length;
   }
   if(last<source.length)fragment.append(document.createTextNode(source.slice(last)));
   element.replaceChildren(fragment);
 }

 const groups={architecture,ai};
 const getLang=()=>document.documentElement.lang?.startsWith('de')?1:0;
 document.querySelectorAll('[data-source-group]').forEach(root=>{
   const items=groups[root.dataset.sourceGroup];if(!items)return;
   const tabs=[...root.querySelectorAll('[data-source-index]')];
   const panel=root.querySelector('[role=tabpanel]');
   const description=root.querySelector('[data-source-description]');
   const file=root.querySelector('[data-source-file]');
   const code=root.querySelector('[data-source-code]');
   const expander=root.querySelector('[data-prompt-expand]');
   const promptPreview=root.querySelector('[data-prompt-preview]');
   let active=0;let expanded=false;
   const pre=code.closest('pre');
   function render(index){
     active=index;const item=items[index];
     description.textContent=item.description[getLang()];
     file.textContent=item.file;
     if(root.dataset.sourceGroup==='ai'&&index===0)code.textContent=item.code;
     else highlightKotlin(code,item.code);
     if(pre)pre.scrollLeft=0;
     tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1});
     panel.setAttribute('aria-labelledby',tabs[index].id);
     if(expander){
       const show=index===0;
       expander.hidden=!show;
       if(promptPreview){promptPreview.classList.toggle('pp-prompt-preview',show);promptPreview.classList.toggle('is-expanded',expanded&&show)}
       const label=expanded?(getLang()?'Weniger anzeigen':'Show less'):(getLang()?'Ganzen Prompt anzeigen':'Show full prompt');
       expander.textContent=label;expander.setAttribute('aria-expanded',String(expanded&&show));
     }
   }
   tabs.forEach((tab,i)=>{
     tab.addEventListener('click',()=>{expanded=false;render(i)});
     tab.addEventListener('keydown',event=>{
       if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
       event.preventDefault();
       const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
       expanded=false;render(next);tabs[next].focus();
     });
   });
   if(expander)expander.addEventListener('click',()=>{
     const wasExpanded=expanded;
     expanded=!expanded;
     render(active);
     // Collapsing a long prompt shortens the page above the viewport.
     // Return to the explorer so the prompt remains visible instead of jumping to Looking back.
     if(wasExpanded){
       requestAnimationFrame(()=>{
         const top=root.getBoundingClientRect().top;
         if(top<80){
           root.style.scrollMarginTop='80px';
           root.scrollIntoView({block:'start',behavior:'auto'});
         }
       });
     }
   });
   new MutationObserver(()=>render(active)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
   render(0);
 });
})();
