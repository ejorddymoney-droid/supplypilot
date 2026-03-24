import { useTheme } from '../../contexts/ThemeContext';
import Icon from './Icon';

const SearchInput = ({ value, onChange, placeholder = "Rechercher...", id = "global-search" }) => {
  const COLORS = useTheme();
  return (
    <div style={{ position:"relative", width:260 }}>
      <label htmlFor={id} style={{ position:'absolute', width:'1px', height:'1px', padding:0, margin:'-1px', overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap', borderWidth:0 }}>
        {placeholder}
      </label>
      <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:COLORS.textDim }} aria-hidden="true">
        <Icon name="search" size={16} />
      </div>
      <input
        id={id}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:"100%", padding:"8px 12px 8px 36px", background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:10, color:COLORS.text, fontSize:13, outline:"none", boxSizing:"border-box" }}
      />
    </div>
  );
};

export default SearchInput;
