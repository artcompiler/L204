exports.globalLexicon = {
    "let" : { "tk": 0x12, "cls": "keyword" },
    "if" : { "tk": 0x05, "cls": "keyword" },
    "then" : { "tk": 0x06, "cls": "keyword" },
    "else" : { "tk": 0x07, "cls": "keyword" },
    "case" : { "tk": 0x0F, "cls": "keyword" },
    "of" : { "tk": 0x10, "cls": "keyword" },
    "end" : { "tk": 0x11, "cls": "keyword", "length": 0 },
    "true" : { "tk": 0x14, "cls": "val", "length": 0 },
    "false" : { "tk": 0x14, "cls": "val", "length": 0 },
    "add" : { "tk": 0x01, "name": "ADD", "cls": "function", "length": 2 , "arity": 2 },  
    "mul" : { "tk": 0x01, "name": "MUL", "cls": "function", "length": 2 , "arity": 2 },
    "addD" : { "tk": 0x01, "name": "ADDD", "cls": "function", "length": 2 , "arity": 2 },  
    "mulD" : { "tk": 0x01, "name": "MULD", "cls": "function", "length": 2 , "arity": 2 },
    "goal" : { "tk": 0x01, "name": "GOAL", "cls": "function", "length": 2 , "arity": 2 },
    "current" : { "tk": 0x01, "name": "CURRENT", "cls": "function", "length": 1 , "arity": 1 },
    "bar" : { "tk": 0x01, "name": "BAR", "cls": "function", "length": 1, "arity": 1},
    "radial" : { "tk": 0x01, "name": "RADIAL", "cls": "function", "length": 1, "arity": 1},
    "animate" : { "tk": 0x01, "name": "ANIMATE", "cls": "function", "length": 2, "arity": 2},
    "size" : { "tk": 0x01, "name": "SIZE", "cls" : "function", "length": 2, "arity": 2},
    "hex" : { "tk": 0x01, "name": "HEX", "cls" : "function", "length": 2, "arity": 2},
    "rgb" : { "tk": 0x01, "name": "RGB", "cls" : "function", "length": 4, "arity": 4},
    "thickness" : { "tk": 0x01, "name": "THICK", "cls" : "function", "length": 2, "arity": 2}
}
