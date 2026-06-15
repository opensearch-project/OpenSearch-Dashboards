# Vis type Timeline

Contains the timeline visualization and the timeline backend.

# Generate a parser
If your grammar was changed in `common/chain.peg` you need to re-generate the static parser:

```
yarn generate:grammars:peg
```

The generated parser will be appeared at `common/_generated_` folder, which is included in `.eslintignore`