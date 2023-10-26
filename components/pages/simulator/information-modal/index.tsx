import * as React from 'react';
import { FormModal } from '../../../modal';
import { useTranslation } from '../../../../hooks/useTranslation';
import { Datatable } from '../../../datatable';
import { GridColDef } from '@mui/x-data-grid';
import { GET_SIMULATOR_PARAMETERS, GET_SIMULATOR_RESULT } from './_graphql';
import { DocumentNode, useSuspenseQuery } from '@apollo/client';
import {
  EModalType,
  IDatasetResult,
  IInformationModal,
  ITableResultData,
  ISimulatorResultResponse,
  ISimulatorParameter,
  ISimulatorParameterData
} from './_types';
import { EModalSize } from '../../../modal/_model';
import ReactECharts from 'echarts-for-react';
import { ChartContainer } from './_styles';

export default function InformationModal({
  openState,
  onClose,
  settings
}: IInformationModal) {
  const { t } = useTranslation();
  const option: echarts.EChartsOption = {
    title: {
      text: t('simulator.simulatorResult')
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['vibration', 'amplitude', 'temperature']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: []
  };

  const [chartOption, setChartOption] =
    React.useState<echarts.EChartsOption>(option);
  const [resultData, setResultData] = React.useState<ITableResultData[]>([]);
  const [parametersData, setParametersData] = React.useState<
    ISimulatorParameter[]
  >([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);

  const parametersColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: t('general.id')
    },
    {
      field: 'failureName',
      headerName: t('failureTypes.failureName'),
      width: 200
    }
  ];

  const resultColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: t('general.id')
    },
    {
      field: 'time',
      headerName: t('simulator.time'),
      width: 200
    },
    {
      field: 'tag',
      headerName: t('simulator.tag')
    },
    {
      field: 'amplitude',
      headerName: t('simulator.amplitude'),
      width: 200
    },
    {
      field: 'vibration',
      headerName: t('simulator.vibration'),
      width: 200
    },
    {
      field: 'temperature',
      headerName: t('simulator.temperature'),
      width: 200
    }
  ];

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const selectedQuery: DocumentNode =
    settings.modalType === EModalType.PARAMETERS
      ? GET_SIMULATOR_PARAMETERS
      : GET_SIMULATOR_RESULT;
  const { data, error } = useSuspenseQuery<ISimulatorResultResponse>(
    selectedQuery,
    {
      variables: {
        simulatorId: settings.simulatorId
      }
    }
  );

  React.useEffect(() => {
    if (data) {
      if (settings.modalType === EModalType.PARAMETERS) {
        const formatData: ISimulatorParameter[] =
          data.simulator_parameters?.map(
            (data: ISimulatorParameterData) => data.failure_type
          );

        if (formatData?.length) {
          setParametersData(formatData);
          setTotalCount(formatData.length);
        }
      } else {
        const datasetResult: IDatasetResult = data.datasets[0]
          ?.result as IDatasetResult;
        if (datasetResult) {
          const joinData: ITableResultData[] = datasetResult.time.map(
            (_time, index) => ({
              id: index,
              time: _time,
              tag: datasetResult.tag[index],
              amplitude: datasetResult.amplitude[index],
              vibration: datasetResult.vibration[index],
              temperature: datasetResult.temperature[index]
            })
          );

          setResultData(joinData);
          setTotalCount(joinData.length);

          const newOption: echarts.EChartsOption = {
            ...chartOption,
            xAxis: {
              ...chartOption.xAxis,
              // @ts-ignore
              data: datasetResult.time
            },
            series: [
              {
                name: t('simulator.amplitude'),
                type: 'line',
                stack: 'Total',
                data: datasetResult.amplitude
              },
              {
                name: t('simulator.vibration'),
                type: 'line',
                stack: 'Total',
                data: datasetResult.vibration
              },
              {
                name: t('simulator.temperature'),
                type: 'line',
                stack: 'Total',
                data: datasetResult.temperature
              },
              {
                name: t('simulator.tag'),
                type: 'line',
                stack: 'Total',
                data: datasetResult.tag
              }
            ],
            tooltip: {}
          };
          setChartOption(newOption);
        }
      }
    } else if (error) {
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error, settings]);

  return (
    <FormModal
      modalSize={
        settings.modalType === EModalType.PARAMETERS
          ? EModalSize.MD
          : EModalSize.XL
      }
      openState={openState}
      onClose={handleClose}
      modalTitle={
        settings.modalType === EModalType.PARAMETERS
          ? t('simulator.simulatorParameters')
          : t('simulator.simulatorResult')
      }
      isShowModalSaveButton={false}
    >
      <Datatable
        columns={
          settings.modalType === EModalType.PARAMETERS
            ? parametersColumns
            : resultColumns
        }
        data={
          settings.modalType === EModalType.PARAMETERS
            ? parametersData
            : resultData
        }
        totalDataCount={totalCount}
        isServerSide={false}
        isSearchable={false}
        isAddButton={false}
      ></Datatable>

      {settings.modalType === EModalType.RESULT ? (
        <ChartContainer>
          <ReactECharts option={chartOption} style={{ height: 500 }} />
        </ChartContainer>
      ) : (
        ''
      )}
    </FormModal>
  );
}
