import * as config from "./config";

// process.env.ORACLETT_AC_ZSH_SETUP_PATH = `${process.env.HOME}/.cache/oraclett/autocomplete/zsh_setup`;
 // && test -f $ORACLETT_AC_ZSH_SETUP_PATH && source $ORACLETT_AC_ZSH_SETUP_PATH

config.createDataDir();

console.log( "done" );
